import uuid
from datetime import datetime, time
from pydantic import BaseModel, model_validator

class BusinessCreate(BaseModel):
	name: str
	phone: str
	slug: str
	payout_method: str = "phone"
	mpesa_shortcode: str | None = None
	payout_phone: str | None = None

	@model_validator(mode="after")
	def check_payout_target(self):
		if self.payout_method == "shortcode" and not self.mpesa_shortcode:
			raise ValueError("mpesa_shortcode is required when payout method is shortcode")
		if self.payout_method == "phone" and not self.payout_phone:
			raise ValueError("payout_phone is required when payout method is phone")
		return self

class BusinessOut(BaseModel):
	id: uuid.UUID
	name: str
	slug: str
	plan: str
	payout_method: str
	mpesa_shortcode: str | None = None
	payout_phone: str | None = None

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

