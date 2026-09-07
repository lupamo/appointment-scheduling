-- initial schema for booking-mvp

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE businesses (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	phone TEXT NOT NULL,
	slug TEXT UNIQUE NOT NULL,
	mpesa_shortcode TEXT,
	timezone TEXT DEFAULT 'Africa/Nairobi',
	plan TEXT NOT NULL DEFAULT 'free',
	plan_expires_at  TIMESTAMPTZ,
	created_at TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE services (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	duration_minutes INT NOT NULL,
	price_kes INT NOT NULL,
	deposit_kes INT NOT NULL,
	active BOOLEAN DEFAULT true
);

CREATE TABLE availability_rules (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
	day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
	start_time TIME NOT NULL,
	end_time TIME NOT NULL
);

CREATE TABLE bookings (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
	service_id UUID REFERENCES services(id),
	customer_name TEXT NOT NULL,
	customer_phone TEXT NOT NULL,
	slot_start TIMESTAMPTZ NOT NULL,
	slot_end TIMESTAMPTZ NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending_payment'
	-- pending payment | confirmed | expired | cancelled| no show --
	hold_expires_at TIMESTAMPTZ,
	mpesa_checkout_request_id TEXT,
	mpesa_receipt_number TEXT,
	created_at TIMESTAMPTZ now()
);

-- prevents double booking at the same slot while payments

CREATE UNIQUE INDEX idx_no_double_booking
	ON bookings (business_id, slot_start)
	WHERE status IN ('pending_payment', 'confirmed');

CREATE TABLE payment_events (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
	event_type TEXT NOT NULL,  -- stk_initiated | callback_success | callback_failed | timeout
	raw_payload JSONB,
	created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bookings_business_status ON bookings (business_id, status);
CREATE INDEX idx_bookings_hold_expires ON bookings (hold_expires_at) WHERE status = 'pending_payment';
