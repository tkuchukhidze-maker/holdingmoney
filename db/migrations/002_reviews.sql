CREATE TABLE reviews (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  reservation_id uuid NOT NULL UNIQUE REFERENCES reservations(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5),
  body text NOT NULL CHECK(length(body) BETWEEN 10 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_property ON reviews(property_id,created_at DESC);
