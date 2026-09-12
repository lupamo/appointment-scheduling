from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Business
from app.schema import BusinessCreate, BusinessOut

router = APIRouter(prefix="/businesses", tags=["businesses"])

@router.post("", response_model=BusinessOut)
async def create_business(payload: BusinessCreate, db:AsyncSession = Depends(get_db)):
	existing = await db.scalar(select(Business).where(Business.slug == payload.slug))
	if existing:
		raise HTTPException(status_code=400, detail="Slug already taken")

	business = Business(**payload.model_dump())
	db.add(business)
	await db.commit()
	await db.refresh(business)
	return business

@router.get("/{slug}", response_model=BusinessOut)
async def get_business_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
	business = await db.scalar(select(Business).where(Business.slug == slug))
	if not business:
		raise HTTPException(status_code=404, detail="Business not Found")
	return business

