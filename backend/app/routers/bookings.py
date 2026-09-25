import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_business_owner
from app.config import settings
from app.database import get_db
from app.models import Booking, Business, PaymentEvent, Service
from app.routers.availability import is_within_business_hours
from app.schema import (
    BookingCreate,
    BookingOut,
    BookingStatusOut,
    RefundRequest,
    RescheduleRequest,
)
from app.services import daraja

router = APIRouter(prefix="/businesses/{business_id}/bookings", tags=["bookings"])

BLOCKING_STATUSES = ("pending_payment", "confirmed")


async def _load_booking(business_id: uuid.UUID, booking_id: uuid.UUID, db: AsyncSession) -> Booking:
    booking = await db.get(Booking, booking_id)
    if not booking or booking.business_id != business_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("", response_model=BookingOut, status_code=201)
async def create_booking(
    business_id: uuid.UUID, payload: BookingCreate, db: AsyncSession = Depends(get_db)
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    service = await db.get(Service, payload.service_id)
    if not service or service.business_id != business.id:
        raise HTTPException(status_code=404, detail="Service not found for this business")
    if not service.active:
        raise HTTPException(status_code=400, detail="That service is no longer offered")

    if payload.slot_start <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot book a slot in the past")

    slot_end = payload.slot_start + timedelta(minutes=service.duration_minutes)

    if not await is_within_business_hours(db, business_id, payload.slot_start, slot_end):
        raise HTTPException(status_code=400, detail="That slot falls outside the business's operating hours")

    hold_expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.booking_hold_minutes)

    booking = Booking(
        business_id=business.id,
        service_id=service.id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        slot_start=payload.slot_start,
        slot_end=slot_end,
        status="pending_payment",
        hold_expires_at=hold_expires_at,
    )
    db.add(booking)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="That slot overlaps an existing booking. Please pick another.")

    await db.refresh(booking)

    try:
        stk = await daraja.initiate_stk_push(
            phone=payload.customer_phone,
            amount=service.deposit_kes,
            account_reference=str(booking.id),
            description=f"Deposit for {service.name}",
        )
        booking.mpesa_checkout_request_id = stk.get("CheckoutRequestID")
        db.add(PaymentEvent(booking_id=booking.id, event_type="stk_initiated", raw_payload=stk))
        await db.commit()
        await db.refresh(booking)
    except Exception as exc:
        db.add(PaymentEvent(
            booking_id=booking.id, event_type="stk_initiation_failed", raw_payload={"error": str(exc)}
        ))
        await db.commit()
        raise HTTPException(status_code=502, detail="Could not initiate M-Pesa payment. Please try again.")

    return booking


@router.get("/{booking_id}/status", response_model=BookingStatusOut)
async def get_booking_status(business_id: uuid.UUID, booking_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Public — the booking's own UUID is effectively its access token for polling."""
    return await _load_booking(business_id, booking_id, db)


@router.post("/{booking_id}/check-payment", response_model=BookingStatusOut)
async def check_payment(business_id: uuid.UUID, booking_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    booking = await _load_booking(business_id, booking_id, db)

    if booking.status != "pending_payment" or not booking.mpesa_checkout_request_id:
        return booking

    try:
        result = await daraja.query_stk_status(booking.mpesa_checkout_request_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach M-Pesa: {exc}")

    raw_code = result.get("ResultCode")
    code = str(raw_code) if raw_code is not None else None

    if code == "0":
        booking.status = "confirmed"
    elif code is not None:
        booking.status = "expired"

    db.add(PaymentEvent(booking_id=booking.id, event_type="manual_status_check", raw_payload=result))
    await db.commit()
    await db.refresh(booking)
    return booking


@router.get("", response_model=list[BookingOut])
async def list_bookings(
    business_id: uuid.UUID,
    business: Business = Depends(require_business_owner),
    db: AsyncSession = Depends(get_db),
):
    """Owner dashboard — requires proving ownership, since this returns customer names/phones."""
    result = await db.execute(
        select(Booking)
        .where(Booking.business_id == business_id, Booking.status.in_(["confirmed", "completed", "no_show"]))
        .order_by(Booking.slot_start)
    )
    return result.scalars().all()


@router.post("/{booking_id}/reschedule", response_model=BookingOut)
async def reschedule_booking(
    business_id: uuid.UUID,
    booking_id: uuid.UUID,
    payload: RescheduleRequest,
    business: Business = Depends(require_business_owner),
    db: AsyncSession = Depends(get_db),
):
    old = await _load_booking(business_id, booking_id, db)

    if old.status != "confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed bookings can be rescheduled")

    notice = timedelta(hours=settings.min_reschedule_notice_hours)
    if old.slot_start - datetime.now(timezone.utc) < notice:
        raise HTTPException(
            status_code=400,
            detail=f"Rescheduling requires at least {settings.min_reschedule_notice_hours} hours' notice",
        )
    if payload.new_slot_start <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot reschedule into the past")

    service = await db.get(Service, old.service_id)
    new_slot_end = payload.new_slot_start + timedelta(minutes=service.duration_minutes)

    old.status = "rescheduled"

    new = Booking(
        business_id=business_id,
        service_id=old.service_id,
        customer_name=old.customer_name,
        customer_phone=old.customer_phone,
        slot_start=payload.new_slot_start,
        slot_end=new_slot_end,
        status="confirmed",
        mpesa_receipt_number=old.mpesa_receipt_number,
        rescheduled_from=old.id,
    )
    db.add(new)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="That new slot is unavailable. Please pick another.")

    await db.refresh(new)
    return new


@router.post("/{booking_id}/mark-completed", response_model=BookingOut)
async def mark_completed(
    business_id: uuid.UUID,
    booking_id: uuid.UUID,
    business: Business = Depends(require_business_owner),
    db: AsyncSession = Depends(get_db),
):
    booking = await _load_booking(business_id, booking_id, db)
    booking.status = "completed"
    await db.commit()
    await db.refresh(booking)
    return booking


@router.post("/{booking_id}/mark-no-show", response_model=BookingOut)
async def mark_no_show(
    business_id: uuid.UUID,
    booking_id: uuid.UUID,
    business: Business = Depends(require_business_owner),
    db: AsyncSession = Depends(get_db),
):
    booking = await _load_booking(business_id, booking_id, db)
    booking.status = "no_show"
    await db.commit()
    await db.refresh(booking)
    return booking


@router.post("/{booking_id}/mark-refunded", response_model=BookingOut)
async def mark_refunded(
    business_id: uuid.UUID,
    booking_id: uuid.UUID,
    payload: RefundRequest,
    business: Business = Depends(require_business_owner),
    db: AsyncSession = Depends(get_db),
):
    booking = await _load_booking(business_id, booking_id, db)
    booking.status = "cancelled"
    booking.refund_status = "completed"
    booking.refunded_amount = payload.amount
    booking.refunded_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(booking)
    return booking