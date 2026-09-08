import uuid
from datetime import datetime, time

from sqlalchemy import String, Integer, Boolean, Foreignkey, TIMESTAMP, Time, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

class Business(Base):
	_tablename_ = "businesses"
	id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
	name: Mapped[str] = mapped_column(String, nullable=False)
	phone: Mapped[str] = mapped_column(String, nullable=False)
	slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
	mpesa_shortcode: Mapped[str | None] = mapped_column(String, nullable=True)
	timezone: Mapped[str] = mapped_column(String, default="Africa/Nairobi")
	plan: Mapped[str] = mapped_column(String, default="free")
	plan_expires_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
	created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.now(datetime.timezone.utc))

	services: Mapped[list["Service"]] = relationship(back_populates="business")
	bookings: Mapped[list["Booking"]] = relationship(back_populates='business')

class Service(Base):
	_tablename_ = "services"

	id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
	business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), Foreignkey("businesses.id"))
	name: Mapped[str] = mapped_column(String, nullable=False)
	duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
	price_kes: Mapped[int] = mapped_column(Integer, nullable=False)
	deposit_kes: Mapped[int] = mapped_column(Integer, nullable=False)
	active: Mapped[bool] = mapped_column(Boolean, default=True)

	business: Mapped["Business"] = relationship(back_populates="services")

class AvailabilityRule(Base):
	_tablename_ = "availability_rules"

	id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
	business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id"))
	day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
	start_time: Mapped[time] = mapped_column(Time, nullable=False)
	end_time: Mapped[time] = mapped_column(Time, nullable=False)


class Booking(Base):
	_tablename_ = "bookings"

	id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
	business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), Foreignkey("businesses.id"))
	service_id: Mapped[uuid.UUID] = mapped_column(UUID())
	customer_name: Mapped[str] = mapped_column(String, nullable=False)
	customer_phone: Mapped[str] = mapped_column(String, nullable=False)
	status: Mapped[str] = mapped_column(String, default="pending_payment")
	hold_expires_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
	mpesa_checkout_request_id: Mapped[str | None] = mapped_column(String, nullable=True)
	mpesa_receipt_number: Mapped[str | None] = mapped_column(String, nullable=True)
	created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.now(datetime.timezone.utc))

	business: Mapped["Business"] = relationship(back_populates="bookings")

class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bookings.id"))
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)

