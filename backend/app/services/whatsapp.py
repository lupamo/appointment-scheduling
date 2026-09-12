"""
WhatsApp Business Cloud API integration.
Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

NOTE: sending free-form messages outside a 24h customer-initiated window
requires an approved message template. Set up a 'booking_confirmation' and
'booking_reminder' template in Meta Business Manager before going live.
"""
import httpx

from app.config import settings

GRAPH_API_URL = f"https://graph.facebook.com/v20.0/{settings.whatsapp_phone_number_id}/messages"


async def send_booking_confirmation(phone: str, business_name: str, service_name: str, slot_start_str: str) -> None:
    await _send_template_message(
        phone=phone,
        template_name="booking_confirmation",
        params=[business_name, service_name, slot_start_str],
    )


async def send_booking_reminder(phone: str, business_name: str, service_name: str, slot_start_str: str) -> None:
    await _send_template_message(
        phone=phone,
        template_name="booking_reminder",
        params=[business_name, service_name, slot_start_str],
    )


async def _send_template_message(*, phone: str, template_name: str, params: list[str]) -> None:
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": p} for p in params],
                }
            ],
        },
    }
    headers = {"Authorization": f"Bearer {settings.whatsapp_token}"}

    async with httpx.AsyncClient() as client:
        resp = await client.post(GRAPH_API_URL, json=payload, headers=headers)
        resp.raise_for_status()
