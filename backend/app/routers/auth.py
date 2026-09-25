from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, get_current_owner, hash_password, verify_password
from app.database import get_db
from app.models import Owner
from app.schema import LoginRequest, OwnerOut, SignupRequest, TokenOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenOut, status_code=201)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(Owner).where(Owner.email == payload.email))
    if existing:
        raise HTTPException(status_code=400, detail="An account with that email already exists")

    owner = Owner(email=payload.email, password_hash=hash_password(payload.password))
    db.add(owner)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="An account with that email already exists")

    await db.refresh(owner)
    return TokenOut(access_token=create_access_token(owner.id))


@router.post("/login", response_model=TokenOut)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    owner = await db.scalar(select(Owner).where(Owner.email == payload.email))
    # Deliberately identical error for "no such email" and "wrong password" —
    # don't let a login attempt reveal which emails have accounts.
    if not owner or not verify_password(payload.password, owner.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return TokenOut(access_token=create_access_token(owner.id))


@router.get("/me", response_model=OwnerOut)
async def me(owner: Owner = Depends(get_current_owner)):
    return owner

