# Episode Holding — venue-aware booking flow

## Key rule: customer != venue

An Episode Customer ID is global across every hotel and restaurant. Being signed in identifies the guest and their contact details; **it does not choose or change the booking venue**.

Every booking belongs to an explicit, stable `venue_id`, determined **from the server-resolved venue route / selected venue**. Never infer venue from the user's last visited location or prior bookings. Do not rely on an untrusted hidden input alone to authorize venue or deposit.

## Public UX

1. Home page: **Restaurants** or **Hotels** (two category links, never both `#houses`).
2. `/restaurants`: explicit choices **ბათუმის სახლში** (Batumi), **ქუთაისის სახლში** (Kutaisi), **თბილისის სახლში** (Tbilisi), optional city filter.
3. `/hotels`: **Hotel Magnolia** (Tbilisi), **Chateau Mere** (Telavi).
4. Clicking a venue opens its approved dedicated screen and shows a persistent **selected venue + city** label with an explicit **Change venue** link to the appropriate collection.
5. Inside that venue choose:
   - restaurant: date, event if applicable, time, party size, occasion/extras;
   - hotel: check-in, check-out, room type, guests, promo/offer.
6. Before confirmation, show a read-only summary with full venue name/city, date/time, party size or nights, applicable deposit/fees and cancellation terms. Provide **Change venue** without silently moving the booking.
7. Anonymous guest: name and phone (and verified OTP if applicable) are collected. Registered guest: prefill from their global profile. Both cases create a reservation attached to the **same venue**.
8. After a successful server transaction (only then): booking ID, venue, date, status and notification receipt; list every venue's bookings together in My Episode, labeled with venue.

A logged-in user must be able to reserve a different restaurant on the next booking without registering again. A user can have multiple concurrent reservations across different cities.

## Future database/API (Laravel phase 2+)

- `venues(id, type, slug, name, city, ...)` unique `slug`.
- `customers(id, ...)` global Episode Customer ID.
- `table_reservations(id, venue_id, customer_id, party_size, starts_at, event_night_id, status, ...)`.
- `hotel_bookings(id, venue_id, customer_id, check_in, check_out, room_type_id, status, ...)`.
- `POST /api/venues/{venue:slug}/table-reservations`; server validates venue type, inventory, identity/guest, business policies.
- `POST /api/venues/{venue:slug}/hotel-bookings`; server validates hotel-specific inventory and offers.
- Transactionally reserve inventory; prevent overbooking and repeat submits with idempotency key. Hold any charge/deposit only under confirmed property-specific policy.
- Staff with venue assignment may view/edit only assigned venue reservations; holding admins can view across venues. Customer can only see their own reservations across all venues.

## Current UI safety

In the existing Node.js preview, **no booking backend exists**. Its five approved `.dc.html` prototypes previously showed fake booking success, fictional SMS confirmations and loyalty credit even though no transaction was created. The public preview now retains those source files unchanged, shows selected venue explicitly and disables their `confirm` action at runtime. Do not tell guests a booking was made. Restore submission only after the Laravel backend and provider integrations are actually running and tested.

The restaurant/home category selection and chosen property context are now implemented and tested in the current working branch. The complete customer and staff booking operations remain separate Laravel build phases.
