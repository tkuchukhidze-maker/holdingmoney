CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE properties (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL CHECK(city IN ('Tbilisi','Batumi','Kutaisi','Telavi')),
  kind text NOT NULL CHECK(kind IN ('restaurant','hotel')),
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT true
);
CREATE TABLE resources (
  id uuid PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES properties(id),
  kind text NOT NULL CHECK(kind IN ('table','room')),
  label text NOT NULL,
  capacity integer NOT NULL CHECK(capacity BETWEEN 1 AND 24),
  active boolean NOT NULL DEFAULT true,
  UNIQUE(id,property_id), UNIQUE(property_id,label)
);
CREATE TABLE events (
  id uuid PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES properties(id),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
  capacity integer NOT NULL CHECK(capacity BETWEEN 1 AND 2000),
  active boolean NOT NULL DEFAULT true,
  UNIQUE(id,property_id)
);
CREATE TABLE staff_memberships (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id),
  role text NOT NULL CHECK(role IN ('admin','manager')),
  CHECK((role='admin' AND property_id IS NULL) OR (role='manager' AND property_id IS NOT NULL)),
  UNIQUE NULLS NOT DISTINCT(user_id,property_id)
);
CREATE TABLE guest_profiles (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  phone text NOT NULL DEFAULT '',
  birthday date,
  marketing_consent boolean NOT NULL DEFAULT false,
  consent_updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE reservations (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  resource_id uuid,
  event_id uuid,
  kind text NOT NULL CHECK(kind IN ('table','room','event')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
  guests integer NOT NULL CHECK(guests BETWEEN 1 AND 12),
  status text NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled','completed')),
  notes text NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
  request_key uuid NOT NULL,
  request_hash text NOT NULL,
  amount_tetri integer NOT NULL DEFAULT 0 CHECK(amount_tetri BETWEEN 0 AND 10000000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK((kind='event' AND event_id IS NOT NULL AND resource_id IS NULL) OR
        (kind IN ('table','room') AND resource_id IS NOT NULL AND event_id IS NULL)),
  FOREIGN KEY(resource_id,property_id) REFERENCES resources(id,property_id),
  FOREIGN KEY(event_id,property_id) REFERENCES events(id,property_id),
  UNIQUE(user_id,request_key),
  EXCLUDE USING gist (resource_id WITH =,tstzrange(starts_at,ends_at,'[)') WITH &&)
    WHERE (resource_id IS NOT NULL AND status IN ('confirmed','completed'))
);
CREATE INDEX reservations_user_date ON reservations(user_id,starts_at DESC);
CREATE INDEX reservations_property_date ON reservations(property_id,starts_at);
CREATE INDEX reservations_event ON reservations(event_id) WHERE status IN ('confirmed','completed');

CREATE TABLE points_ledger (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  reservation_id uuid REFERENCES reservations(id),
  source text NOT NULL UNIQUE,
  points integer NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX points_ledger_user ON points_ledger(user_id,created_at DESC);
CREATE TABLE audit_log (
  id uuid PRIMARY KEY,
  actor_id text NOT NULL REFERENCES "user"(id),
  action text NOT NULL,
  entity_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE rate_buckets (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count integer NOT NULL CHECK(count>0)
);
CREATE TABLE email_outbox (
  id uuid PRIMARY KEY,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  last_error text
);
CREATE INDEX email_pending ON email_outbox(available_at) WHERE sent_at IS NULL;
