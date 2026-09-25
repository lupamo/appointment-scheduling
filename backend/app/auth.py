import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import Business, Owner

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(owner_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(owner_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> uuid.UUID:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return uuid.UUID(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_owner(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Owner:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    owner_id = decode_access_token(credentials.credentials)
    owner = await db.get(Owner, owner_id)
    if not owner:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return owner


async def require_business_owner(
    business_id: uuid.UUID,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
) -> Business:
    """
    Loads the business AND confirms the current owner actually owns it.
    Returns 404 either way (business doesn't exist, or isn't yours) —
    never reveal that a business exists to someone who doesn't own it.
    """
    business = await db.get(Business, business_id)
    if not business or business.owner_id != owner.id:
        raise HTTPException(status_code=404, detail="Business not found")
    return business