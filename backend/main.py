from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.jobs import expire_abandoned_holds
from app.routers import businesses, services, bookings, mpesa

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
	scheduler.add_job(expire_abandoned_holds, "interval", minutes=1)
	scheduler.start()
	yield
	scheduler.shutdown()

app = FastAPI(title="Booking MVP API", lifespan=lifespan)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(businesses.router)


@app.get("/health")
async def health():
	return {"status": "ok"}