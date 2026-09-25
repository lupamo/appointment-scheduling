"""
What a business offers. `duration_minutes` here is what the booking
endpoint uses to compute slot_end — the client never sends slot_end.

TODO before production: no auth. Anyone can add services to any business.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_business_owner
from app.database import get_db
from app.models import Business, Service
from app.schema import ServiceCreate, ServiceOut

router = APIRouter(prefix="/businesses/{business_id}/services", tags=["services"])


@router.post("", response_model=ServiceOut, status_code=201)
async def create_service(business_id: uuid.UUID, payload: ServiceCreate, business: Business = Depends(require_business_owner),db: AsyncSession = Depends(get_db),):
    if payload.duration_minutes <= 0:
        raise HTTPException(status_code=400, detail="duration_minutes must be positive")
    if payload.deposit_kes > payload.price_kes:
        raise HTTPException(status_code=400, detail="deposite cannot exceed price")
    service = Service(business_id=business.id, **payload.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


@router.get("", response_model=list[ServiceOut])
async def list_services(business_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Service).where(Service.business_id == business_id, Service.active.is_(True))
    )
    return result.scalars().all()


@router.delete("/{service_id}", status_code=204)
async def deactivate_service(
    business_id: uuid.UUID, service_id: uuid.UUID, business: Business = Depends(require_business_owner), db: AsyncSession = Depends(get_db)
):
    """Soft delete — existing bookings still reference this service."""
    service = await db.get(Service, service_id)
    if not service or service.business_id != business_id:
        raise HTTPException(status_code=404, detail="Service not found")
    service.active = False
    await db.commit()