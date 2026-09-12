"""
Background job: releases slots where a customer never completed payment
(no callback ever arrived because they closed the tab, ignored the PIN
prompt, etc). Runs every minute via APScheduler, started in main.py.
"""
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Booking


async def expire_abandoned_holds():
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Booking).where(Booking.status == "pending_payment", Booking.hold_expires_at < now)
        )
        stale_bookings = result.scalars().all()
        for booking in stale_bookings:
            booking.status = "expired"
        if stale_bookings:
            await db.commit()
