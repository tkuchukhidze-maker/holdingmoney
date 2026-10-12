# Episode Holding · Laravel 12 foundation

**Phase 1 of 8.** Laravel 12 · PHP ^8.3 · Inertia.js 2 + React 19 / TypeScript · Vite 6 · Tailwind CSS 4 · MySQL 8 (PostgreSQL supported).

## Source of truth — approved design

The supplied **`EPISODE_HOLDING_FULL_SOURCE (1).zip`** contains nine Claude Design Component (`.dc.html`) prototypes. They are the approved source of truth for typography, colours, Georgian copy, screen structure and interactive behaviour. **These prototypes are not production HTML**; they rely on `support.js`, which is not included.

Phase 1 establishes the framework and the shared theme/layouts only. It intentionally does **not** claim to have ported those nine screens or to offer working guest registration, booking, loyalty or admin functionality. Porting the approved designs and `renderVals()/setState()` interactions is scheduled in Phases 4–6. See `docs/DESIGN_SOURCE.md` for SHA-256 checksums of each source screen.

### Import approved prototypes without redesign

Use the archive just supplied by the client. This source ZIP contains the nine original files and their independent React viewer/runtime, but no Laravel backend.

```bash
node scripts/import-designs.mjs "/path/to/EPISODE_HOLDING_FULL_SOURCE (1).zip"
```

The script checks **all nine SHA-256 hashes first**, then writes their original bytes to `design/project/` unchanged. It does **not** convert the designs to application screens (Phase 4–6) or publish them to production. The exact nine files and `canvas.json` have already been imported to this Phase 1 branch. The importer remains useful for future source verification.

### Implementation status

| Item | Phase 1 |
| --- | --- |
| Laravel 12 + Inertia/React/TypeScript + Vite/Tailwind | Scaffolded |
| Approved colours / Google Fonts and venue accents | Configured |
| Holding, venue, customer, registration and control-center layout components | Scaffolded (not page ports) |
| Default locale Georgian, English and Russian switching | Scaffolded |
| MySQL/PostgreSQL environment template | Scaffolded |
| Sanctum, spatie/permission, Pest package declarations | Added (business auth/scopes in Phase 3) |
| CI: PHP style/tests, ESLint, TS and Vite build | Configured |
| Real bookings, users, dashboards, offers, payments | **Not implemented** |

## Local setup

Requires PHP 8.3+, Composer 2, Node 22+, MySQL 8+ or PostgreSQL. Do not reuse the old Next.js project's PostgreSQL schema for the Laravel application.

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
# Set DB_* credentials in .env and create a fresh empty DB.
php artisan migrate
php artisan serve
npm run dev
```

Open `http://localhost:8000`. To run production assets: `npm run build`.

## Checks

```bash
composer validate --no-check-publish
vendor/bin/pint --test
php artisan test
npm run lint
npm run typecheck
npm run build
```

**Lockfiles:** Composer and npm lockfiles are not generated in this environment because dependency resolution is unavailable here. CI resolves dependencies independently. Before a production release, run `composer update` and `npm install` in a connected development environment and commit both generated lockfiles; update CI to `npm ci`.

**Database note:** Default Laravel framework migrations are included for scaffold compatibility; the normalized Episode operational schema, tenant scopes, shared customers and fake factories will be added in Phase 2. Default user tables are not an authorization mechanism.

**Credentials:** No production secrets, payment keys or real customers have been added. `APP_KEY` is blank in `.env.example`. Demo data must be obviously fake and isolated.

## PR / deployment policy

One Pull Request per phase, not eight changes mixed together. This PR is the Phase 1 source transition from the preexisting Next.js tree. **Do not merge and redeploy an operational site without a migration and rollback plan**; merging replaces the code at repository root and does not migrate any existing user database. No production deployment is part of Phase 1.

See `docs/PHASE_PLAN.md` for the phase sequence, done/stubbed inventory and missing inputs.

## Isolated prototype preview

The `prototype-preview/` folder is a standalone Node.js preview of the approved designs. It is **not** the Laravel application and saves no real bookings. Laravel Cloud supports monorepo app directories: select `prototype-preview` in a **separate preview application/environment**, use Node.js 22, build `npm install --no-audit --no-fund && npm run build`, start `npm start`, and set no database. The root Laravel application remains on its own staging/runtime. Production must stay on the existing live branch until application phases 2–8 are complete. For exact steps see `docs/LARAVEL_CLOUD.md`.
