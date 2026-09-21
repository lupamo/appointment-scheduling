import uuid
from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AvailabilityRule, Booking, Business, Service
from app.schema import AvailabilityRuleCreate, AvailabilityRuleOut

router = APIRouter(prefix="/businesses/{business_id}", tags=["availability"])

BLOCKING_STATUSES = ("pending_payment", "confirmed")

# Slots are offered at this granularity regardless of service duration —
# e.g. a 45-min service can start at 9:00, 9:15, 9:30... not just on the hour.
# Tune this per-business later if needed; fixed for MVP.
SLOT_GRANULARITY_MINUTES = 15


@router.post("/availability-rules", response_model=AvailabilityRuleOut, status_code=201)
async def create_availability_rule(
    business_id: uuid.UUID, payload: AvailabilityRuleCreate, db: AsyncSession = Depends(get_db)
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    if not (0 <= payload.day_of_week <= 6):
        raise HTTPException(status_code=400, detail="day_of_week must be 0 (Sun) through 6 (Sat)")
    if payload.start_time >= payload.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")

    rule = AvailabilityRule(business_id=business_id, **payload.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.get("/availability-rules", response_model=list[AvailabilityRuleOut])
async def list_availability_rules(business_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AvailabilityRule)
        .where(AvailabilityRule.business_id == business_id)
        .order_by(AvailabilityRule.day_of_week, AvailabilityRule.start_time)
    )
    return result.scalars().all()


@router.delete("/availability-rules/{rule_id}", status_code=204)
async def delete_availability_rule(
    business_id: uuid.UUID, rule_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    rule = await db.get(AvailabilityRule, rule_id)
    if not rule or rule.business_id != business_id:
        raise HTTPException(status_code=404, detail="Availability rule not found")
    await db.delete(rule)
    await db.commit()


async def is_within_business_hours(
    db: AsyncSession, business_id: uuid.UUID, slot_start: datetime, slot_end: datetime
) -> bool:
    """
    Lighter check than get_open_slots — just confirms the requested window
    falls inside SOME availability_rule for that day. Does NOT check for
    overlapping bookings; the database's GIST exclusion constraint already
    owns that guarantee (see bookings.py create_booking).
    """
    day_of_week = (slot_start.weekday() + 1) % 7

    rules_result = await db.execute(
        select(AvailabilityRule).where(
            AvailabilityRule.business_id == business_id,
            AvailabilityRule.day_of_week == day_of_week,
        )
    )
    rules = rules_result.scalars().all()

    slot_start_time = slot_start.timetz().replace(tzinfo=None)
    slot_end_time = slot_end.timetz().replace(tzinfo=None)

    return any(
        rule.start_time <= slot_start_time and slot_end_time <= rule.end_time
        for rule in rules
    )


async def get_open_slots(
    db: AsyncSession, business_id: uuid.UUID, service: Service, target_date: date
) -> list[datetime]:
    """
    Core availability algorithm, shared by the GET endpoint below and by
    the booking-creation validation in bookings.py.

    1. Find the business's hours for this day of week.
    2. Generate candidate start times at SLOT_GRANULARITY_MINUTES steps
       that fit entirely within those hours.
    3. Drop candidates that overlap an existing pending_payment/confirmed
       booking, or that are already in the past.
    """
    day_of_week = (target_date.weekday() + 1) % 7  # Python: Mon=0..Sun=6 -> ours: Sun=0..Sat=6

    rules_result = await db.execute(
        select(AvailabilityRule).where(
            AvailabilityRule.business_id == business_id,
            AvailabilityRule.day_of_week == day_of_week,
        )
    )
    rules = rules_result.scalars().all()
    if not rules:
        return []  # business is closed this day — no rules defined for it

    bookings_result = await db.execute(
        select(Booking).where(
            Booking.business_id == business_id,
            Booking.status.in_(BLOCKING_STATUSES),
            Booking.slot_start >= datetime.combine(target_date, time.min, tzinfo=timezone.utc),
            Booking.slot_start < datetime.combine(target_date + timedelta(days=1), time.min, tzinfo=timezone.utc),
        )
    )
    existing = bookings_result.scalars().all()

    duration = timedelta(minutes=service.duration_minutes)
    step = timedelta(minutes=SLOT_GRANULARITY_MINUTES)
    now = datetime.now(timezone.utc)

    open_slots: list[datetime] = []
    for rule in rules:
        window_start = datetime.combine(target_date, rule.start_time, tzinfo=timezone.utc)
        window_end = datetime.combine(target_date, rule.end_time, tzinfo=timezone.utc)

        candidate = window_start
        while candidate + duration <= window_end:
            candidate_end = candidate + duration

            if candidate <= now:
                candidate += step
                continue

            overlaps = any(
                candidate < b.slot_end and candidate_end > b.slot_start
                for b in existing
            )
            if not overlaps:
                open_slots.append(candidate)

            candidate += step

    return sorted(open_slots)


@router.get("/availability")
async def get_availability(
    business_id: uuid.UUID,
    service_id: uuid.UUID,
    on_date: date = Query(..., alias="date", description="YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    service = await db.get(Service, service_id)
    if not service or service.business_id != business_id:
        raise HTTPException(status_code=404, detail="Service not found for this business")
    if not service.active:
        raise HTTPException(status_code=400, detail="That service is no longer offered")

    slots = await get_open_slots(db, business_id, service, on_date)
    return {"date": on_date.isoformat(), "service_id": str(service_id), "slots": [s.isoformat() for s in slots]}

