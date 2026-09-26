import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_owner, require_business_owner
from app.database import get_db
from app.models import Business, Owner
from app.schema import BusinessCreate, BusinessOut

router = APIRouter(prefix="/businesses", tags=["businesses"])

@router.post("", response_model=BusinessOut, status_code=201)
async def create_business(payload: BusinessCreate, owner: Owner = Depends(get_current_owner), db:AsyncSession = Depends(get_db)):
	existing = await db.scalar(select(Business).where(Business.slug == payload.slug))
	if existing:
		raise HTTPException(status_code=400, detail="Slug already taken")

	business = Business(**payload.model_dump(), owner_id=owner.id)
	db.add(business)

	try:
		await db.commit()
	except IntegrityError:
		await db.rollback()
		raise HTTPException(status_code=400, detail="Slug already taken")

	await db.refresh(business)
	return business

@router.get("/mine", response_model=list[BusinessOut])
async def list_my_business(owner: Owner = Depends(get_current_owner), db: AsyncSession = Depends(get_db)):
	result = await db.execute(select(Business).where(Business.owner_id == owner.id))
	return result.scalars().all()


@router.get("/{slug}", response_model=BusinessOut)
async def get_business_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
	# Public endpoint - allows customers to view business info by slug
	business = await db.scalar(select(Business).where(Business.slug == slug))
	if not business:
		raise HTTPException(status_code=404, detail="Business not Found")
	return business

@router.get("/by-id/{business_id}", response_model=BusinessOut)
async def get_business_by_id(business_id: uuid.UUID, business: Business = Depends(require_business_owner), db:AsyncSession = Depends(get_db)):
	return business

@router.put("/{business_id}", response_model=BusinessOut)
async def update_business(business_id: uuid.UUID, payload: BusinessCreate, business: Business = Depends(require_business_owner), db:AsyncSession = Depends(get_db)):
	# Check if slug is taken by another business
	if payload.slug != business.slug:
		existing = await db.scalar(select(Business).where(Business.slug == payload.slug))
		if existing:
			raise HTTPException(status_code=400, detail="Slug already taken")
	
	# Update business fields
	business.name = payload.name
	business.phone = payload.phone
	business.slug = payload.slug
	business.payout_method = payload.payout_method
	business.mpesa_shortcode = payload.mpesa_shortcode
	business.payout_phone = payload.payout_phone
	
	try:
		await db.commit()
	except IntegrityError:
		await db.rollback()
		raise HTTPException(status_code=400, detail="Slug already taken")
	
	await db.refresh(business)
	return business

