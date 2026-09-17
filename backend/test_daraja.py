"""
Standalone Daraja sandbox test — run this BEFORE testing through the full
booking flow. Isolates the payment integration so if something breaks,
you know immediately it's Daraja-related, not a booking/DB bug.

Usage:
    python test_daraja.py

Requires ngrok running and DARAJA_CALLBACK_URL in .env pointing at it.
"""
import asyncio
import sys

from app.services import daraja


async def main():
    print("1. Getting access token...")
    try:
        token = await daraja.get_access_token()
        print(f"   OK — token starts with: {token[:15]}...")
    except Exception as e:
        print(f"   FAILED: {e}")
        print("   Check DARAJA_CONSUMER_KEY / DARAJA_CONSUMER_SECRET in .env")
        sys.exit(1)

    print("\n2. Triggering STK push to sandbox test number 254708374149...")
    try:
        result = await daraja.initiate_stk_push(
            phone="254708374149",
            amount=1,
            account_reference="test-daraja-001",
            description="Daraja sandbox test",
        )
        print(f"   Response: {result}")
        checkout_id = result.get("CheckoutRequestID")
        if not checkout_id:
            print("   WARNING: no CheckoutRequestID in response — check the shape above")
            sys.exit(1)
        print(f"\n   CheckoutRequestID: {checkout_id}")
        print("   -> On a real phone you'd enter PIN 1111 now.")
        print("   -> In sandbox, the callback should still fire automatically within ~30s")
        print("      IF your ngrok URL is correctly set as DARAJA_CALLBACK_URL.")
        print("   -> Watch your `uvicorn` terminal (running separately) for the callback hitting /mpesa/callback.")
    except Exception as e:
        print(f"   FAILED: {e}")
        print("   Check DARAJA_SHORTCODE / DARAJA_PASSKEY and that they match the")
        print("   sandbox values from the Daraja docs.")
        sys.exit(1)

    print("\n3. Waiting 20s, then actively querying status (tests the fallback path too)...")
    await asyncio.sleep(20)
    try:
        status = await daraja.query_stk_status(checkout_id)
        print(f"   Query result: {status}")
    except Exception as e:
        print(f"   Query failed (this can be normal if still pending): {e}")


if __name__ == "__main__":
    asyncio.run(main())

