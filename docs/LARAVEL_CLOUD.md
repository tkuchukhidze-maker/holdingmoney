# Laravel Cloud — Episode Holding migration runbook

This runbook targets the owner-supplied Laravel Cloud application:
`https://cloud.laravel.com/tornike-kuchukhidze-2/episodeholding/production`.

**IMPORTANT — do not deploy Phase 1 to Production.** The current production site is served from the existing Next.js `main` branch. The Laravel 12 replacement is an independent, incomplete foundation being developed on `phase/01-laravel12-foundation` (PR #10). It does not yet implement bookings, login, venue-aware authorization, loyalty, or admin. Changing Production's runtime, repository root, or branch now may cause downtime and loss of availability. This repository does not contain the actual database, and no migration or deletion has been performed on production.

## Preferred path — isolated Preview environment

1. Open the Laravel Cloud application and inspect the existing **Production** environment. Record the currently deployed Git branch/commit and runtime. Keep its current deployment unchanged.
2. Enable Laravel Cloud **Pull Request Preview environments**, or create a separate staging environment if PR previews are unavailable for the plan/application. Connect the *same GitHub repository* `tkuchukhidze-maker/episodeholding` and branch `phase/01-laravel12-foundation` (PR #10).
3. Select **PHP 8.3** for the Laravel environment (do not keep the production Next.js/Node runtime). Build the Laravel directory at repository root.
4. Attach a **new isolated** preview database (MySQL 8 or PostgreSQL). **Never attach the live production Next.js database**; schemas are not compatible. Laravel Cloud will inject database credentials.
5. Configure app variables: `APP_NAME=Episode Holding`, `APP_ENV=staging`, `APP_DEBUG=false`, `APP_LOCALE=ka`, `APP_FALLBACK_LOCALE=en`. Let Cloud inject `APP_KEY`, `APP_URL`, database settings and resources. Never commit real `.env`.
6. For this foundation branch *before lockfiles are committed*, a preview-only build can use:
   ```bash
   composer install --no-interaction --prefer-dist --optimize-autoloader
   npm install --no-audit --no-fund
   npm run build
   ```
   Production release must instead use committed `composer.lock` and `package-lock.json` with deterministic `composer install --no-dev --prefer-dist --optimize-autoloader` and `npm ci && npm run build`. The lockfiles are a release blocker.
7. On a **new, isolated preview DB only**, use the deploy command:
   ```bash
   php artisan migrate --force
   ```
   Do not run existing Next.js migrations against the new Laravel schema, or vice versa.
8. Deploy the PR Preview, review its logs, confirm HTTP 200 at `/` and `/up`, and confirm that the basic language selector works for `ka/en/ru`.

The **Phase 1 landing page is a plain scaffolding screen**, not one of the approved nine designs. The approved prototype files can be verified and imported into source using `node scripts/import-designs.mjs '/path/to/EPISODE_HOLDING_FULL_SOURCE (1).zip'` locally. Actual production UI screen implementations belong to Phases 4–6.

## Source handoff

- Source ZIP: `EPISODE_HOLDING_FULL_SOURCE (1).zip` from client.
- `README.md` and `MISSING.md` inside the ZIP explicitly say the export is **only nine Claude Design prototypes plus a standalone React viewer**, not a Laravel app.
- The `design/project/*.dc.html` are the exact design source; do not rewrite their copy, colours, state or interaction specifications.
- `docs/DESIGN_SOURCE.md` contains the verified 64-character SHA-256 for all nine screens.
- All nine original prototype files and canvas.json are committed byte-for-byte under `design/project/`; the preview viewer sources live in `prototype-preview/`. The ZIP attachment to this ChatGPT conversation is not an authenticated GitHub/Cloud artifact.

## Production release prerequisites (after Phases 2–8)

- Approved full UI parity across nine screens; no missing bracketed placeholders replaced with invented real data.
- Tested venue scoping and roles, safe OTP auth, reviews, loyalty and booking workflows.
- Verified/owned restaurant/hotel inventory, accurate event lineups and prices, and legally approved terms.
- Payment, SMS/email and POS/PMS integrations configured through encrypted environment secrets.
- Production DB backup, rollout/rollback plan, queue worker and scheduler, logs and monitoring.
- Successful CI including booking/auth/role/promo tests, locked dependency manifests and smoke tests against staging.

**No Laravel Cloud API token or authenticated Cloud session is connected to the current engineering environment**, so GitHub commits and PRs do not imply Cloud deployment. An account owner must initiate a Preview from the Cloud UI or connect an authorized Cloud deployment capability. Do not paste any Cloud tokens or passwords into chat.

## After preview verification

Only switch the real `production` branch and runtime once Phases 1–8 are merged, fully tested, and signed off. The currently deployed version should remain available as a rollback target throughout migration.

Official Laravel Cloud guide: https://laravel.com/cloud/deploy-a-laravel-app

## Preview the nine approved screens now (without waiting for the Laravel backend)

In Laravel Cloud's **New Application** flow, select `tkuchukhidze-maker/episodeholding`, branch `phase/01-laravel12-foundation`, and **application directory `prototype-preview`**. Choose its Node.js runtime (Node 22). This is a separate read-only prototype viewer, not the Laravel app. Set build command `npm install --no-audit --no-fund && npm run build`, leave deploy/migration command blank, and start with `npm start`. The process binds to `PORT`. Do not attach the production database or production domains.

Routes are `/?screen=Main`, `/?screen=Batumi`, `/?screen=Kutaisi`, `/?screen=Tbilisi`, `/?screen=Magnolia`, `/?screen=ChateauMere`, `/?screen=Register`, `/?screen=MyEpisode`, `/?screen=Admin`. Every transaction is **simulated**. If Laravel Cloud cannot select the `prototype-preview` directory from the existing app, create a second application within the account and select that directory in the monorepo selector (see official Laravel Cloud monorepo documentation).

The project owner must complete the Cloud console integration in an authorized session; GitHub access in this conversation cannot authorize Laravel Cloud deployments.
