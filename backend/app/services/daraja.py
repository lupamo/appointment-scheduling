"""
Daraja (M-pesa) STK push integration
sandbox URL; https://sandbox.safaricom.co.ke
production base URL: https://api.safaricom.co.ke
Not tested on live
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
	auth = (settings.daraja_Consumer_key, settings.daraja_consumer_secret)
	async with httpx.AsyncClient() as client:
		resp = await client.get(url, auth=auth)
		resp.raise_for_status()
		return resp.json()["access_token"]

def _password_and_timestamp() -> tuple[str, str]:
	timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
	raw = f"{settings.daraja_shortcode}{settings.daraja_passkey}{timestamp}"
	password = base64.b64encode(raw.encode()).decode()
	return password, timestamp

async def initiate_stk_push(*, phone: str, amount: int, account_reference: str, description: str) -> dict:
	"""
	Triggers an STK push prompt on the customer's phone.
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
	headers = {"Authorization": f"Bearer {token}"} 

	async with httpx.AsyncClient() as client:
		resp = await client.post(f"{BASE_URL}/mpesa/stkpush/v1/processrequest", json=payload, header=headers)
		resp.raise_for_status()
		return resp.json()

async def query_stk_status(checkout_request_id: str) -> dict:
	"""
    Fallback status check — call this from the frontend's 'check payment status'
    button if the webhook callback hasn't arrived within ~15 seconds.
    """
	token = await get_access_token()
	password, timestamp = _password_and_timestamp()

	payload = {
		"BusinessShortCode": settings.daraja_shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "CheckoutRequestID": checkout_request_id,
	}
	headers = {"Authorization": f"Bearer {token}"}

	async with httpx.AsyncClient() as client:
		resp = await client.post(f"{BASE_URL}mpesa/stkpushquery/v1/query", json=payload, headers=headers)
		resp.raise_for_status()
		return resp.json()

