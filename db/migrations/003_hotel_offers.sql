-- Hotel promotions are published only after a manager enables them.
CREATE TABLE hotel_offers (
  id uuid PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL CHECK (length(title) BETWEEN 2 AND 100),
  summary text NOT NULL CHECK (length(summary) BETWEEN 1 AND 250),
  terms text NOT NULL DEFAULT '',
  discount_percent integer CHECK (discount_percent BETWEEN 1 AND 80),
  min_nights integer NOT NULL DEFAULT 1 CHECK (min_nights BETWEEN 1 AND 30),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id,slug)
);
CREATE INDEX hotel_offers_public ON hotel_offers(property_id,ends_at) WHERE active = true;
