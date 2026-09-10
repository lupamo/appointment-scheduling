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
	status TEXT NOT NULL DEFAULT 'pending_payment',
	-- pending payment | confirmed | expired | cancelled| no show --
	hold_expires_at TIMESTAMPTZ,
	mpesa_checkout_request_id TEXT,
	mpesa_receipt_number TEXT,
	rescheduled_from UUID REFERENCES bookings(id),
	created_at TIMESTAMPTZ DEFAULT now()
);

-- prevents double booking at the same slot while payments

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
	EXCLUDE USING gist (
		business_id WITH =,
		tstzrange(slot_start, slot_end) WITH &&
	)
	WHERE (status IN ('pending_payment', 'confirmed'));

ALTER TABLE businesses ADD COLUMN payout_method TEXT NOT NULL DEFAULT 'phone'
	CHECK (payout_method IN ('shortcode', 'phone'));
ALTER TABLE businesses AND COLUMN payout_phone TEXT;

----- ENFORCE AT THE DB LEVEL EXACTLY ONE PAYOUT TARGET-----
ALTER TABLE businesses ADD CONSTRAINT payout_target_required
	CHECK (
		(payout_method = 'shortcode' AND mpesa_shortcode IS NOT NULL)
		OR (payout_method = 'phone' AND payout_method IS NOT NULL)
	)

CREATE TABLE payment_events (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
	event_type TEXT NOT NULL,  -- stk_initiated | callback_success | callback_failed | timeout
	raw_payload JSONB,
	created_at TIMESTAMPTZ DEFAULT now()
);


CREATE INDEX idx_services_business_id ON services(business_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_business_id ON bookings(business_id);
CREATE INDEX idx_bookings_business_status ON bookings (business_id, status);
CREATE INDEX idx_bookings_hold_expires ON bookings (hold_expires_at) WHERE status = 'pending_payment';
CREATE INDEX idx_bookings_checkout_request ON bookings(mpesa_checkout_request_id);
CREATE INDEX idx_payment_events_booking_id ON payment_events(booking_id);
CREATE INDEX idx_bookings_rescheduled_from ON bookings(rescheduled_from) WHERE rescheduled_from IS NOT NULL;