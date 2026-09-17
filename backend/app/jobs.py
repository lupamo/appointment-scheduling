"""
Background jobs.

Why this file exists: the 'customer never entered their PIN' path has NO
triggering event. Daraja never calls you. Without this job those bookings
sit as pending_payment forever, blocking the slot permanently.

Any state whose only exit depends on an external system needs a timeout
backstop. See backend-architecture-explained.md Part 4.
"""
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Booking


async def expire_abandoned_holds() -> int:
    """Releases slots whose payment hold window elapsed. Returns count expired."""
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Booking).where(
                Booking.status == "pending_payment",
                Booking.hold_expires_at < now,
            )
        )
        stale = result.scalars().all()
        for booking in stale:
            booking.status = "expired"
        if stale:
            await db.commit()
        return len(stale)

    