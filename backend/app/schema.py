import uuid
from datetime import datetime, time
from pydantic import BaseModel

class BusinessCreate(BaseModel):
	name: str
	phone: str
	slug: str
	mpesa_shortcode: str | None = None

class BusinessOut(BaseModel):
	id: uuid.UUID
	name: str
	slug: str
	plan: str

	class Config:
		from_attributes = True


# -- Services ---
class ServiceCreate(BaseModel):
	name: str
	duration_minutes: int
	price_kes: int
	deposit_kes: int

class ServiceOut(ServiceCreate):
	id: uuid.UUID
	active: bool

	class Config:
		from_attributes = True


#--Availability -----
class AvailabilityRuleCreate(BaseModel):
	days_of_week: int
	start_time: time
	end_time: time

# - Booking --------
class BookingCreate(BaseModel):
	service_id: uuid.UUID
	customer_name: str
	customer_phone: str
	slot_start: datetime

class BookingOut(BaseModel):
	id: uuid.UUID
	status: str
	slot_start: datetime
	slot_end: datetime
	customer_name: str
	mpesa_receipt_number: str | None = None

	class Config:
		from_attributes = True

class BookingStatusOut(BaseModel):
	id: uuid.UUID
	status: str

