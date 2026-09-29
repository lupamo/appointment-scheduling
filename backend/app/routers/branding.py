import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_business_owner
from app.config import settings
from app.database import get_db
from app.models import Business
from app.schema import BioUpdate, BusinessOut

router = APIRouter(prefix="/businesses/{business_id}/branding", tags=["branding"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_CONTENT_TYPES = {"images/jpeg": "jpg", "images/png": "png", "images/webp": "webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


async def _save_image(business_id: uuid.UUID, file: UploadFile, kind: str) -> str:
	if file.content_type not in ALLOWED_CONTENT_TYPES:
		raise HTTPException(
			status_code=400
			detail="Image must be JPEG, PNG or WEBP",
		)
	contents = await file.read()
	if len(contents) > MAX_UPLOAD_BYTES:
		raise HTTPException(status_code=400, detail="Imagemust be under 5MB")
	if len(contents) == 0:
		raise HTTPException(status_code=400, detail="Empty File")

	ext = ALLOWED_CONTENT_TYPES[file.content_type]
	filename = f"{business_id}-{kind}-{uuid.uuid4().hex[:8]}.{ext}"
	path = UPLOAD_DIR / filename
	path.write_bytes(contents)

	return f"{settings.app_base_url}/uploads/{filename}"

@router.post("/banner", response_model=BusinessOut)
async def upload_banner(business_id: uuid.UUID, file: UploadFile, business: Business = Depends(require_business_owner), db: AsyncSession = Depends(get_db),):
	url = await _save_image(business_id, file, "banner")
	business.banner_url = url
	await db.commit()
	await db.refresh(business)
	return business


@router.post("/profile-image", response_model=BusinessOut)
async def upload_profile_image(business_id: uuid.UUID, file: UploadFile, business: Business = Depends(require_business_owner),db: AsyncSession = Depends(get_db),):
	url = await _save_image(business_id, file, "profile")
	business.profile_image_url = url
	await db.commit()
	await db.refresh(business)
	return business

@router.patch("/bio", response_model=BusinessOut)
async def update_bio(business_id: uuid.UUID, payload: BioUpdate, business: Business = Depends(require_business_owner), db: AsyncSession = Depends(get_db),):
	business.bio = payload.bio
	await db.commit()
	await db.refresh(business)
	return business

