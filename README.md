# Episode Holding

Episode-ის პირველი სამუშაო ვერსია: დამტკიცებული დიზაინი, რეგისტრაცია, პირადი სივრცე, რესტორნის/სასტუმროს/ღონისძიების ჯავშნები და ლოიალობის ქულები.

**ეს არის პილოტი.** საწყისი ობიექტები, ღონისძიებები და ინვენტარი საცდელია. დიზაინის ფოტოები საცნობარო მაკეტიდანაა და რეალურ ობიექტებს არ ადასტურებს. საჯარო გაშვებამდე საჭიროა რეალური ინვენტარი, საკუთარი ფოტოები, ჯავშნის პირობები, კონფიდენციალურობის ტექსტი და ელფოსტის გამართული მიწოდება.

## Implemented

- Responsive ivory, bronze and dark-green design with separate home, restaurant, hotel, calendar, venue detail, event detail, search, booking, authentication, account, loyalty, review, about and staff pages. The single repeated dialog template has been removed.
- Email/password registration, email verification, sign-in/out and password reset through Better Auth. Passwords are hashed by the library; sessions use HTTP-only cookies.
- Personal profile, optional birthday and separate optional marketing consent. Public signup never grants staff rights.
- Table, room and event reservations; guests can see and cancel their own upcoming reservations. Staff work only within assigned properties; global administrators cover all properties.
- Best-fit resource selection: the smallest free table/room that fits the group. PostgreSQL exclusion constraints reject overlapping resource allocations. Per-property transaction locks serialize availability checks; event capacity is checked under the same lock. Retry keys prevent duplicate bookings and reward deductions.
- Staff completion records an integer-tetri amount and credits points once (1 point per whole GEL). Membership tier follows completed spend. A ledger records credits and reward requests; wallet locks prevent concurrent overspending.
- Public availability preview, rechecked transactionally on confirmation. Verified reviews are limited to owned, completed reservations; every rating appears publicly.
- Staff inventory UI creates/edits tables, rooms and events. Administrators manage properties and assign/remove verified venue managers. Archive through deactivation; existing reservations remain valid. Event capacity cannot fall below reserved seats; booked events cannot be rescheduled through the editor.
- Audit log, strict request schemas, origin checks, request-size limits, database-backed rate limits and an email outbox with retry handling.
- Unit and PostgreSQL integration tests plus GitHub Actions CI.

## Stack

Node.js 24 · TypeScript · Next.js 16 / React 19 · PostgreSQL 18 · Better Auth. The first release keeps API and domain modules in the Next.js application. It does not need a separate NestJS service. PostgreSQL is the source of truth; no browser storage is used for sessions or bookings.

## Local setup

Requires Node 24 and Docker Compose (or PostgreSQL 18 with permission to install `btree_gist`).

```sh
npm ci
npm run setup:local
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. `setup:local` creates a private `.env` with random database and authentication secrets and refuses to overwrite an existing file. Never commit `.env`.

Register an account, then preview queued verification emails in another terminal:

```sh
npm run mail:preview
```

Open the generated text file in `.local/mail/` and follow its verification link. Files contain private account links; the directory is ignored by Git. The preview worker is disabled in production. Sign in after verification.

Grant the first administrator to an existing **verified** account:

```sh
npm run admin:grant -- owner@example.com
```

There is no default administrator or shared password. Global administrators can assign and remove venue managers from `/staff` → Staff access. The employee must first register and verify their email. Manager permissions apply only to the selected property; public signup cannot choose a staff role.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

Integration tests require an **isolated disposable database whose name ends in `_test`**. They reset its user, venue and related data. Set `DATABASE_URL`, `APP_ORIGIN`, a random `BETTER_AUTH_SECRET`, `REQUIRE_EMAIL_VERIFICATION=true`, and `EPISODE_TEST_DATABASE=1`, then run:

```sh
npm run test:integration
```

CI provisions its own PostgreSQL service. Tests exercise concurrent inventory allocation, idempotency, cross-user and staff boundaries, database overlap rejection, event capacity, room checkout boundaries, single-credit completion, concurrent reward spending and the registration → verification → session → reset → logout lifecycle. Additional tests cover availability previews, all-rating verified reviews, scoped catalog editing, booked capacity protection and manager provisioning.

## Production setup

1. Provision PostgreSQL, backups and restore procedures. Use a migration account able to install `btree_gist`, and a least-privilege application account for normal requests.
2. Set `DATABASE_URL`, a unique random `BETTER_AUTH_SECRET`, and HTTPS `APP_ORIGIN`. Configure database TLS according to the provider; do not disable certificate verification.
3. Run migrations once before starting the application. Do not seed a live booking system with demonstration availability. Replace the four featured catalog entries and images with approved venue information; provision resources/events and set `is_demo=false` only after validation.
4. Configure `RESEND_API_KEY` and `EMAIL_FROM` with an approved sender domain. Run `npm run mail:send` from a scheduled worker, for example once per minute. Each run claims up to 20 messages. Monitor unsent rows and exhausted retries (five attempts); successful production deliveries redact the link body. No mail provider is contacted unless this worker is configured and run.
5. Run `npm run build`, then `npm start`, behind HTTPS. Preserve host/origin correctly. Set `TRUST_PROXY=true` only when a trusted proxy overwrites `X-Forwarded-For`; otherwise leave it false. Configure perimeter throttling and request limits too.
6. Verify signup, real email delivery, reset, booking, cancellation and assigned staff access on staging. Add operational monitoring and an incident/backup owner before accepting guests.

Authentication requires verified email in production. Write APIs enforce `Origin === APP_ORIGIN`. Domain errors do not disclose database details. The static landing markup is checked-in trusted code; dynamic UI data is escaped before rendering. The CSP currently permits inline script/style for Next.js and the approved design; nonce-based CSP is a future hardening improvement.

## Scope and rules to confirm

- English UI preserves the approved mockup. Full Georgian localization is pending.
- Georgia timezone (`Asia/Tbilisi`, UTC+4); table durations 90/120/180 minutes; hotel check-in 14:00 and checkout 12:00; 1–30 nights, one resource per booking, up to 12 guests. Bookings start within 366 days. No table-combination algorithm yet.
- Event ticket capacity is independent of table/room inventory. Event cancellation reopens capacity. Physical-resource overlap is additionally enforced by PostgreSQL; event capacity relies on the transactional service path. Do not insert live event reservations directly with SQL.
- No payment, price quote, cancellation fee, POS/PMS synchronization or external venue confirmation is implemented. Completing a visit is a staff assertion of the paid amount, not a payment transaction.
- Rewards are recorded requests, with manual venue fulfillment. Tiers and rewards are sample rules, not a published loyalty contract. Birthday promotions and notifications are not automated.
- NPS, CRM campaigns, gift cards, QR flows, B2B billing and AI recommendations are later modules. The design does not claim these are operational.
- Account export/deletion, data-retention automation, multi-factor authentication are pending. Establish privacy/retention terms before collecting real guest data.

## Source layout

`app/` — pages, styling and API routes; `components/` — shared shell, catalog pages, account journeys and staff operations; `lib/` — auth/domain/transaction services; `db/migrations/` — versioned schema; `scripts/` — migration, demo inventory, administrator setup and email worker; `tests/` — domain and PostgreSQL tests.

Applied SQL migrations are checksummed and must not be edited after deployment; add a new migration. Dependency versions and lockfile are committed. Changes to Better Auth require checking its generated migrations before deployment.

## Laravel Cloud / Next.js production troubleshooting

This deployment uses **Next.js and PostgreSQL** even when its hostname ends in `.laravel.cloud`. The `laravel-brand-design` branch is a separate prototype: do not deploy Laravel/PHP commands against this Next.js application.

If a venue website loads but displays **"The booking service is unavailable"** or booking fields are disabled, open `/api/platform-status` (a read-only diagnostic that never prints database credentials). Interpret its `state`:

| State | Meaning and recommended action |
| --- | --- |
| `database_not_configured` | The runtime does not have `DATABASE_URL`. Provision/attach a production PostgreSQL database, then provide the connection through Laravel Cloud's environment/secret management. |
| `database_connection_or_schema_error` | Could not query the database. Check production database reachability, TLS, access controls and deployment logs. Never send secrets to chat. |
| `migrations_required` | Schema tables are missing. Run the versioned database migrations with the trusted production environment after taking a database backup. |
| `catalog_empty` | Schema exists but no active properties were loaded. Configure actual venue records using the authenticated staff system. |
| `inventory_empty` | Properties exist but no active rooms/tables have been configured. Add verified physical inventory in staff settings. |
| `ready` | Required tables, active venues and active resources exist. This **does not** certify real booking readiness: check live room/table inventory and operational confirmation, email, cancellation policies and auth. |

Run production migrations with `npm run db:migrate:cloud` **only in the deploy/administrative shell with production environment variables injected**. Do not use the `npm run db:migrate` development command in Cloud because it expects a local `.env` file. This is a Next.js app, not an Artisan application: do not run `php artisan migrate`. Never run `npm run db:seed` against a live guest booking database; that inserts test properties, test rooms and test event programmes.

Verify `APP_ORIGIN` is the exact HTTPS deployment origin; `BETTER_AUTH_SECRET` is a persistent random secret with at least 32 characters; `DATABASE_URL` references the correct production Postgres database. After provisioning and migrations, create verified venues, real resources, and staff assignments. Until then, pages may be viewable but **must not pretend to accept real reservations**.

