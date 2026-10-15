# Restaurant menu planning and booking intake

## Customer flow

All photos are unpublished (including gallery controls, photo assets and CSS
background URLs); existing `/brand/` logos remain. Original design source files
are archived unchanged. The public renderer suppresses their photo placeholders.

Restaurant booking links open `/restaurants/{slug}/book`. A guest can compose a
menu on the menu page or within the booking page. Planning asks for occasion and
1–100 guests and offers budgets of 80/100/120 GEL per guest, or a custom budget
from 80 to 1000 GEL. Each option shows real catalog line quantities, a computed
total and actual per-person cost. Integer quantities can leave a small unused
part of the budget; prices are never altered to force a package total. Alcohol
is excluded. Portion suitability and dietary requirements need staff review.

Batumi is the only populated catalog. Kutaisi and Tbilisi allow requests without
a menu, and explain why automatic menus are unavailable. Never copy prices
across venues. Planning preferences and selected item quantities are scoped to
the restaurant; contact details are kept in memory only.

When a guest submits with no menu, a native dialog asks whether to compose one.
Yes opens the planner without losing booking fields. No submits an empty menu.
A selected menu goes in the same JSON request as contact/date/time/guest details.
The backend stores the request as **pending**, not a confirmed reservation.

## Enable durable intake

The existing public site runs as a separate Node application. Deploy the Laravel
backend with its configured database, run `php artisan migrate`, and set a long
random `BOOKING_API_TOKEN` in both environments using their secret managers.
Set Node's `BOOKING_API_URL` to the backend's full HTTPS endpoint:
`https://<backend-host>/api/booking-requests`.

The Node server forwards same-origin JSON requests; it never ships the token to
the browser. Without configuration the API returns 503 and the UI preserves the
form and menu without claiming that a request was sent. No fallback to ephemeral
filesystem storage is used. No live delivery has been enabled by this PR.

Laravel validates dates, venue, contact details, quantities and item IDs. It
resolves item prices from `database/catalog/restaurant-menus.json` and writes a
single atomic row with the complete menu snapshot. Client-supplied prices are
rejected. A unique request UUID ensures safe retries; changing the payload with
the same UUID yields 409. Public callers cannot list or retrieve other bookings.
The shared backend intake has a 120/minute throttle; size is limited to 24 KB at
the Node proxy. Provider-specific notification delivery is not configured.

Staff with deployment-console access can review the inbox:

```bash
php artisan booking:requests --venue=batumi
php artisan booking:requests EP-<reference>
```

The second command includes the attached menu and contact details. These are
personal data; keep deployment-console access limited to authorized staff. A
staff web inbox and email/SMS/WhatsApp notifications remain separate integrations;
no destination or provider credentials were supplied.

## Catalog maintenance

The server catalog and browser catalog must stay identical. After editing the
approved venue menu source, regenerate the JSON:

```bash
node --input-type=module -e "import {writeFileSync} from 'node:fs'; import {RESTAURANT_MENUS} from './prototype-preview/src/menu-data.js'; writeFileSync('database/catalog/restaurant-menus.json', JSON.stringify(RESTAURANT_MENUS,null,2)+'\\n');"
```

The catalog equality regression test prevents unnoticed drift. Menu data is
source-transcribed, not proof of current availability. No live payments occur.

## Checks and rollback

Frontend: syntax checks, build, 32 unit tests, nine design validations, nine-page
browser smoke, mobile UX/calendar tests and new booking/photo tests passed.
Booking browser tests exercise a local test server, not a live restaurant.
PHP feature tests cover authorized intake, server prices, idempotency, no-menu
requests and rejected invalid/cross-venue selections. PHP/Composer are unavailable
in the local runner; GitHub CI successfully validated the PHP feature tests and
style checks on commit 7b42896a441ef85c0b92c45aac26f62279e69b59. Both CI jobs, including
Cloud readiness and all browser checks, passed.

To disable intake, remove Node `BOOKING_API_URL` while preserving the database.
Reverting frontend code does not require dropping the booking table. Back up any
real requests before considering a migration rollback.

## Modern home and release consistency

The public `/` now renders `home.jsx`: a compact Georgian header, restaurant/hotel
choice cards and a real quick-booking form. Restaurant/date/time/guest selections
carry into the booking request page; there is no hard-coded "Tonight, 12 Oct".
The original approved Main design remains archived and validated separately.

Production HTML points to content-addressed JS/CSS filenames. Every build writes
`dist/version.json` with the active asset manifest. Page/design responses and CDN
headers prohibit stale caching. The legacy unversioned assets remain available
for diagnostics but are not referenced by production HTML. This prevents cached
old icon bundles being reused under the same URL; it does not control manual
Cloud rollbacks or deployments of another Git branch.

The modern-home browser check covers 320/390/744/1280px layouts, SVG navigation,
asset versions, restaurant booking prefills and selected-hotel routing.
