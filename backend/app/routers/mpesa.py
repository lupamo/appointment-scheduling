from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.middleware import validate_safaricom_ip
from app.models import Booking, Business, PaymentEvent, Service
from app.services import daraja, whatsapp

router = APIRouter(prefix="/mpesa", tags=["mpesa"])


@router.post("/callback/{webhook_secret}")
async def mpesa_callback(
    webhook_secret: str,
    request: Request,
    _ip_valid: None = Depends(validate_safaricom_ip)
):
    """
    Daraja calls this asynchronously after the customer completes (or cancels/
    times out on) the STK push prompt. Must respond 200 quickly — Daraja will
    retry on failure/timeout, which could double-process a booking if you're
    not careful. Idempotency: check booking.status before mutating it.
    
    SECURITY LAYERS:
    1. Webhook secret token in URL path prevents URL guessing
    2. IP whitelisting ensures requests come from Safaricom
    3. Transaction verification with Daraja API before confirming
    4. Strict payload validation
    """
    # Security Layer 1: Validate webhook secret
    if webhook_secret != settings.daraja_webhook_secret:
        # Return 200 to avoid revealing security measures
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    
    payload = await request.json()
    
    # Security Layer 4: Basic payload structure validation
    if not isinstance(payload, dict):
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    
    body = payload.get("Body", {})
    if not isinstance(body, dict):
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    
    stk_callback = body.get("stkCallback", {})
    if not isinstance(stk_callback, dict):
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    
    checkout_request_id = stk_callback.get("CheckoutRequestID")
    result_code = stk_callback.get("ResultCode")
    
    if not checkout_request_id or result_code is None:
        return {"ResultCode": 0, "ResultDesc": "Accepted"}

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
            # Security Layer 3: Verify transaction with Daraja before confirming
            # This prevents fake callbacks from confirming bookings
            is_verified = await daraja.verify_transaction_success(checkout_request_id)
            
            if not is_verified:
                # Transaction verification failed - treat as suspicious
                db.add(PaymentEvent(
                    booking_id=booking.id, 
                    event_type="callback_verification_failed", 
                    raw_payload=payload
                ))
                await db.commit()
                return {"ResultCode": 0, "ResultDesc": "Accepted"}
            
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
                # log this properly once real logging is set up
                pass

    return {"ResultCode": 0, "ResultDesc": "Accepted"}
