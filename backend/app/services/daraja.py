"""
All M-Pesa / Daraja communication lives here.

Isolating it means Daraja's quirks (base64 passwords, timestamp format,
sandbox vs prod hosts) stay in one file, and swapping providers later
touches only this module.

NOT YET VERIFIED against a live Daraja sandbox — written to the documented
API shape. Real payloads sometimes differ. Test before trusting with money.
"""
import base64
from datetime import datetime

import httpx

from app.config import settings

BASE_URL = (
    "https://api.safaricom.co.ke"
    if settings.daraja_env == "production"
    else "https://sandbox.safaricom.co.ke"
)


async def get_access_token() -> str:
    url = f"{BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
    auth = (settings.daraja_consumer_key, settings.daraja_consumer_secret)
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, auth=auth)
        resp.raise_for_status()
        return resp.json()["access_token"]


def _password_and_timestamp() -> tuple[str, str]:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    raw = f"{settings.daraja_shortcode}{settings.daraja_passkey}{timestamp}"
    return base64.b64encode(raw.encode()).decode(), timestamp


async def initiate_stk_push(*, phone: str, amount: int, account_reference: str, description: str) -> dict:
    """
    Prompts the customer's phone for their M-Pesa PIN.

    Returns Daraja's immediate ack, which contains CheckoutRequestID.
    Store that on the booking — it's the only way to match the later
    webhook callback back to this booking.

    Note: this returning successfully means "prompt sent", NOT "paid".
    """
    token = await get_access_token()
    password, timestamp = _password_and_timestamp()

    payload = {
        "BusinessShortCode": settings.daraja_shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": settings.daraja_shortcode,
        "PhoneNumber": phone,
        "CallBackURL": settings.daraja_callback_url,
        "AccountReference": account_reference,
        "TransactionDesc": description,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{BASE_URL}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        resp.raise_for_status()
        return resp.json()


async def query_stk_status(checkout_request_id: str) -> dict:
    """
    Actively asks Daraja what happened, instead of waiting for the webhook.
    Used by the /check-payment fallback when the callback is slow or lost.
    """
    token = await get_access_token()
    password, timestamp = _password_and_timestamp()

    payload = {
        "BusinessShortCode": settings.daraja_shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "CheckoutRequestID": checkout_request_id,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{BASE_URL}/mpesa/stkpushquery/v1/query",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        resp.raise_for_status()
        return resp.json()

