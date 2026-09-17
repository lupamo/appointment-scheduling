"""
All WhatsApp Business Cloud API communication.

Sending outside a 24h customer-initiated window requires pre-approved
message templates. Create 'booking_confirmation' and 'booking_reminder'
templates in Meta Business Manager before this works in production.
"""
import httpx

from app.config import settings

GRAPH_API_URL = f"https://graph.facebook.com/v20.0/{settings.whatsapp_phone_number_id}/messages"


async def send_booking_confirmation(phone: str, business_name: str, service_name: str, slot_str: str) -> None:
    await _send_template(phone=phone, template="booking_confirmation",
                         params=[business_name, service_name, slot_str])


async def send_booking_reminder(phone: str, business_name: str, service_name: str, slot_str: str) -> None:
    await _send_template(phone=phone, template="booking_reminder",
                         params=[business_name, service_name, slot_str])


async def _send_template(*, phone: str, template: str, params: list[str]) -> None:
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": template,
            "language": {"code": "en"},
            "components": [{
                "type": "body",
                "parameters": [{"type": "text", "text": p} for p in params],
            }],
        },
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            GRAPH_API_URL, json=payload,
            headers={"Authorization": f"Bearer {settings.whatsapp_token}"},
        )
        resp.raise_for_status()

