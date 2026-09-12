from fastapi import APIRouter, Request
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Booking, Business, PaymentEvent, Service
from app.services import whatsapp

router = APIRouter(prefix="/mpesa", tags=["mpesa"])


@router.post("/callback")
async def mpesa_callback(request: Request):
    """
    Daraja calls this asynchronously after the customer completes (or cancels/
    times out on) the STK push prompt. Must respond 200 quickly — Daraja will
    retry on failure/timeout, which could double-process a booking if you're
    not careful. Idempotency: check booking.status before mutating it.
    """
    payload = await request.json()
    stk_callback = payload.get("Body", {}).get("stkCallback", {})
    checkout_request_id = stk_callback.get("CheckoutRequestID")
    result_code = stk_callback.get("ResultCode")

    async with AsyncSessionLocal() as db:
        booking = await db.scalar(
            select(Booking).where(Booking.mpesa_checkout_request_id == checkout_request_id)
        )
        if not booking:
            # Log and ack anyway — nothing to do, but Daraja shouldn't get a retry storm
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        # Idempotency guard — callback may arrive more than once
        if booking.status != "pending_payment":
            return {"ResultCode": 0, "ResultDesc": "Already processed"}

        if result_code == 0:
            receipt = None
            for item in stk_callback.get("CallbackMetadata", {}).get("Item", []):
                if item.get("Name") == "MpesaReceiptNumber":
                    receipt = item.get("Value")
            booking.status = "confirmed"
            booking.mpesa_receipt_number = receipt
            db.add(PaymentEvent(booking_id=booking.id, event_type="callback_success", raw_payload=payload))
        else:
            booking.status = "expired"
            db.add(PaymentEvent(booking_id=booking.id, event_type="callback_failed", raw_payload=payload))

        await db.commit()

        if booking.status == "confirmed":
            business = await db.get(Business, booking.business_id)
            service = await db.get(Service, booking.service_id)
            try:
                await whatsapp.send_booking_confirmation(
                    phone=booking.customer_phone,
                    business_name=business.name,
                    service_name=service.name,
                    slot_start_str=booking.slot_start.strftime("%a %d %b, %I:%M %p"),
                )
            except Exception:
                # Don't fail the webhook response over a WhatsApp send failure —
                # log this properly once real logging is set up.
                pass

    return {"ResultCode": 0, "ResultDesc": "Accepted"}
