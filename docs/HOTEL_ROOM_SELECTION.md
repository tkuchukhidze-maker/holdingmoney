# Hotel room-selection assistant

Both hotel pages and the homepage link to `/hotels/{slug}/book`. A guest chooses
check-in/check-out, adults, children, number of rooms, bed preference and visit
purpose. Recommendations filter by bed type and capacity, counting every child
as a guest. The smallest fitting type ranks first. When more rooms are needed,
the assistant proposes the minimum compatible room count; it never silently
increases the guest's selection. Changing criteria invalidates the previous
room choice while preserving contact input.

Magnolia's five room types/capacities come from the approved design. They describe
types only, not real-time inventory. Room sizes, unknown rates, discounts and
availability are not fabricated. Chateau Mere's prototype contains placeholders,
so it has no published room catalog yet. Guests can request staff assistance at
either hotel; these requests have a null room ID and retain all preferences.

A request contains the selected room ID, room count, dates, adult/child counts,
bed preference, purpose, contact and notes. Laravel resolves the room snapshot
from `database/catalog/hotel-rooms.json`, verifies capacity and bed compatibility
and stores a pending request in `hotel_booking_requests`. Unique UUIDs prevent
retry duplication. No price, payment or confirmed reservation is implied.

## Activation

Run the new migration on the Laravel intake database using the established
backup/deployment workflow. The same server-only `BOOKING_API_TOKEN` protects
both intake endpoints. Node derives `/api/hotel-booking-requests` from the existing
`BOOKING_API_URL` ending in `/api/booking-requests`; a custom full
`HOTEL_BOOKING_API_URL` can override it. Without a configured intake, submission
returns an error and retains the guest's data.

Authorized staff can review requests through the deployment console:

```bash
php artisan hotel:requests --venue=magnolia
php artisan hotel:requests EH-<reference>
```

No public list endpoint or message provider is added. Provider notifications and
the authenticated staff web inbox remain separate integrations.

## Catalog updates

Update `prototype-preview/src/hotel-rooms.js` only with approved room data, then
regenerate `database/catalog/hotel-rooms.json` from its HOTEL_ROOMS export. A test
asserts server/browser catalog equality. Add Chateau Mere room types only after
real names, beds and capacities are supplied.

## Validation and rollback

Unit checks cover matching, bed preferences, multiple-room alternatives, missing
catalogs and invalid stays. Browser checks cover 320/390/744/1280px layouts,
criteria invalidation, preserved contact details, room-assisted requests and
server forwarding using a local test intake. PHP feature checks validate token
protection, dates, capacities, cross-hotel IDs, unknown types and idempotency.

Rollback frontend code to restore prior routing. Keep the new table and any real
request records; never drop a live inbox as part of a UI rollback.
