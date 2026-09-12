from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Business, Service
from app.schema import ServiceCreate, ServiceOut

router = APIRouter(prefix="/businesses/{business_id}/services", tags=["services"])


async def _get_business_or_404(business_id, db: AsyncSession) -> Business:
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@router.post("", response_model=ServiceOut)
async def create_service(business_id, payload: ServiceCreate, db: AsyncSession = Depends(get_db)):
    await _get_business_or_404(business_id, db)
    service = Service(business_id=business_id, **payload.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


@router.get("", response_model=list[ServiceOut])
async def list_services(business_id, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Service).where(Service.business_id == business_id, Service.active == True)  # noqa: E712
    )
    return result.scalars().all()
