import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.jobs import expire_abandoned_holds
from app.routers import businesses, services, bookings, mpesa

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def _run_expiry_job():
	try:
		count = await expire_abandoned_holds()
		if count:
			logger.info("Expired %d abandoned booking hold(s)", count)
	except Exception:
		#Never let a job crash take down the scheduler
		logger.exception("expire_abandoned_hold failed")
	
@asynccontextmanager
async def lifespan(app: FastAPI):
	scheduler.add_job(_run_expiry_job, "interval", minutes=1, id="expiry_holds")
	scheduler.start()
	yield
	scheduler.shutdown()

app = FastAPI(title="Booking MVP API", lifespan=lifespan)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(businesses.router)
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(mpesa.router)


@app.get("/health")
async def health():
	return {"status": "ok"}