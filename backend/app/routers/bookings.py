from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Booking, Business, PaymentEvent, Service
from app.schema import BookingCreate, BookingOut, BookingStatusOut
from app.services import daraja

router = APIRouter(prefix="/businesses/{business_id}/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut)
async def create_booking(business_id, payload: BookingCreate, db: AsyncSession = Depends(get_db)):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    service = await db.get(Service, payload.service_id)
    if not service or service.business_id != business.id:
        raise HTTPException(status_code=404, detail="Service not found for this business")

    slot_end = payload.slot_start + timedelta(minutes=service.duration_minutes)
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
        # Unique index on (business_id, slot_start) for pending/confirmed bookings caught a clash
        await db.rollback()
        raise HTTPException(status_code=409, detail="That slot was just taken. Please pick another.")

    await db.refresh(booking)

    # Trigger the STK push. If this fails, the booking still exists as
    # pending_payment and will expire naturally via the cleanup job —
    # surface the error so the frontend can prompt a retry.
    try:
        stk_response = await daraja.initiate_stk_push(
            phone=payload.customer_phone,
            amount=service.deposit_kes,
            account_reference=str(booking.id),
            description=f"Deposit for {service.name}",
        )
        booking.mpesa_checkout_request_id = stk_response.get("CheckoutRequestID")
        db.add(PaymentEvent(booking_id=booking.id, event_type="stk_initiated", raw_payload=stk_response))
        await db.commit()
        await db.refresh(booking)
    except Exception as exc:
        db.add(PaymentEvent(booking_id=booking.id, event_type="stk_initiation_failed", raw_payload={"error": str(exc)}))
        await db.commit()
        raise HTTPException(status_code=502, detail="Could not initiate M-Pesa payment. Please try again.")

    return booking


@router.get("/{booking_id}/status", response_model=BookingStatusOut)
async def get_booking_status(business_id, booking_id, db: AsyncSession = Depends(get_db)):
    """Poll this (every 2-3s) while showing the customer the 'enter your PIN' screen."""
    booking = await db.get(Booking, booking_id)
    if not booking or booking.business_id != business_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.get("/{booking_id}/check-payment", response_model=BookingStatusOut)
async def force_check_payment(business_id, booking_id, db: AsyncSession = Depends(get_db)):
    """
    Fallback for when the Daraja callback hasn't arrived within ~15s.
    Actively queries Daraja instead of waiting for the webhook.
    """
    booking = await db.get(Booking, booking_id)
    if not booking or booking.business_id != business_id:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "pending_payment" or not booking.mpesa_checkout_request_id:
        return booking

    result = await daraja.query_stk_status(booking.mpesa_checkout_request_id)
    result_code = result.get("ResultCode")

    if result_code == "0" or result_code == 0:
        booking.status = "confirmed"
        # ResultDesc/receipt parsing depends on exact sandbox vs prod payload shape — verify against real responses
    elif result_code is not None:
        booking.status = "expired"

    db.add(PaymentEvent(booking_id=booking.id, event_type="manual_status_check", raw_payload=result))
    await db.commit()
    await db.refresh(booking)
    return booking


@router.get("", response_model=list[BookingOut])
async def list_bookings(business_id, db: AsyncSession = Depends(get_db)):
    """Powers the business dashboard's upcoming-bookings list."""
    result = await db.execute(
        select(Booking)
        .where(Booking.business_id == business_id, Booking.status.in_(["confirmed", "completed"]))
        .order_by(Booking.slot_start)
    )
    return result.scalars().all()


@router.post("/{booking_id}/mark-completed", response_model=BookingOut)
async def mark_completed(business_id, booking_id, db: AsyncSession = Depends(get_db)):
    booking = await db.get(Booking, booking_id)
    if not booking or booking.business_id != business_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "completed"
    await db.commit()
    await db.refresh(booking)
    return booking


@router.post("/{booking_id}/mark-no-show", response_model=BookingOut)
async def mark_no_show(business_id, booking_id, db: AsyncSession = Depends(get_db)):
    booking = await db.get(Booking, booking_id)
    if not booking or booking.business_id != business_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "no_show"
    await db.commit()
    await db.refresh(booking)
    return booking
