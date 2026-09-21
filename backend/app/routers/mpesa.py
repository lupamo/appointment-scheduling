"""
Receives Daraja's asynchronous callbacks.

Separate from bookings.py because the CALLER is different — Daraja, not
your frontend. Different trust model, different error handling, and it
must be idempotent because Daraja retries.

SECURITY: the callback body itself is NOT trusted for the state
transition. Anyone who discovers this URL could POST a fake
'ResultCode: 0' and try to get a free confirmed booking. Instead, on
receiving a callback we actively verify the real result by calling
Daraja's own query_stk_status API with our own credentials — an
attacker can't forge that response, since it comes from Daraja's
servers, not the request they sent us.

The callback body's CallbackMetadata (receipt number) IS still used,
but only once the query has independently verified success — never on
its own.
"""
import logging

from fastapi import APIRouter, Request
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Booking, Business, PaymentEvent, Service
from app.services import daraja, whatsapp

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/mpesa", tags=["mpesa"])


@router.post("/callback")
async def mpesa_callback(request: Request):
    """
    Always returns 200 to Daraja, even on problems — a non-200 triggers
    retries, which just adds noise. We record everything to payment_events
    so nothing is lost.
    """
    payload = await request.json()
    stk = payload.get("Body", {}).get("stkCallback", {})
    checkout_request_id = stk.get("CheckoutRequestID")

    async with AsyncSessionLocal() as db:
        booking = await db.scalar(
            select(Booking).where(Booking.mpesa_checkout_request_id == checkout_request_id)
        )
        if not booking:
            # No matching booking — either a stale/replayed ID or a forged
            # one with no real booking to attach to. Nothing to do either way.
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        # IDEMPOTENCY GUARD: Daraja retries, and a duplicate (or replayed
        # forged) callback must not re-process an already-settled booking.
        if booking.status != "pending_payment":
            return {"ResultCode": 0, "ResultDesc": "Already processed"}

        # --- VERIFY, don't trust: ask Daraja directly what really happened ---
        verified_code: str | None = None
        try:
            query_result = await daraja.query_stk_status(checkout_request_id)
            raw = query_result.get("ResultCode")
            verified_code = str(raw) if raw is not None else None
        except Exception as exc:
            logger.warning("STK verification query failed for %s: %s", checkout_request_id, exc)
            db.add(PaymentEvent(
                booking_id=booking.id,
                event_type="callback_verification_failed",
                raw_payload={"callback": payload, "error": str(exc)},
            ))
            await db.commit()
            # FAIL CLOSED: do not confirm on an unverifiable callback. The
            # booking stays pending_payment — the customer's own
            # /check-payment retry or the abandoned-hold job will resolve
            # it eventually. Safer to under-confirm than to let a forged
            # callback through because verification happened to be down.
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        if verified_code == "0":
            receipt = None
            for item in stk.get("CallbackMetadata", {}).get("Item", []):
                if item.get("Name") == "MpesaReceiptNumber":
                    receipt = item.get("Value")
            booking.status = "confirmed"
            booking.mpesa_receipt_number = receipt
            db.add(PaymentEvent(
                booking_id=booking.id,
                event_type="callback_success_verified",
                raw_payload={"callback": payload, "verification": query_result},
            ))
        else:
            booking.status = "expired"      # releases the slot
            db.add(PaymentEvent(
                booking_id=booking.id,
                event_type="callback_failed_verified",
                raw_payload={"callback": payload, "verification": query_result},
            ))

        await db.commit()

        if booking.status == "confirmed":
            business = await db.get(Business, booking.business_id)
            service = await db.get(Service, booking.service_id)
            try:
                await whatsapp.send_booking_confirmation(
                    phone=booking.customer_phone,
                    business_name=business.name,
                    service_name=service.name,
                    slot_str=booking.slot_start.strftime("%a %d %b, %I:%M %p"),
                )
            except Exception:
                # A WhatsApp failure must not fail the payment webhook —
                # the money already moved. TODO: real logging here.
                pass

    return {"ResultCode": 0, "ResultDesc": "Accepted"}

    