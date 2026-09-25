CREATE TABLE owners (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email TEXT UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
	created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE businesses ADD COLUMN owner_id UUID REFERENCES owners(id);

CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);

