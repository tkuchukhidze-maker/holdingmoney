# Episode Holding delivery phases

| Phase | PR scope |
| --- | --- |
| 1 · Foundation | Laravel 12, Inertia React TS, Tailwind theme, locale framework, scaffold layouts, CI |
| 2 · Database | Normalized schema from the archive, per-venue scope, shared customers, factories, fake-only seeders |
| 3 · Auth | Customer OTP + email verification, staff auth, venue assignments, 6 roles × module access |
| 4 · Public | Approved Main/restaurant/hotel UI port, event calendars, booking flows, chat and offers |
| 5 · My Episode | Approved registration/customer dashboard, loyalty, digital QR, reviews, preferences |
| 6 · Control Center | Full Admin prototype, dashboards and all operational modules with scoped authorization |
| 7 · Integrations | Provider interfaces and isolated fake drivers for payments/messaging/wallet/POS/PMS |
| 8 · Deployment | Docker/Forge, queue and scheduler, backups, operational guide |

## Phase 1 completion checklist

**Done in source:** Laravel framework entrypoints; PHP/composer requirements; Inertia root and React entrypoint; Tailwind CSS palette; Georgian default language and English/Russian switching; holding/venue/customer/admin/registration layout shells; basic scaffold page; GitHub Actions CI; .env example, no credentials; starter Pest smoke tests.

**Stubs only:** All operational pages, venue discovery, real-time booking, profile storage, roles/permissions, customer login/OTP, CRM, analytics and admin. Sanctum and Spatie packages are declared, but there is no application authorization policy or real data migration in Phase 1.

**Still required from Episode:** approved original `.dc.html` design archive checked into the target repo; actual logos/photos; venue contact, pricing and inventory details; payment/SMS/email/WhatsApp/POS/PMS providers and credentials; loyalty rules and legal text; deployment destination and rollback plan.

**Repository note:** The requested placeholder `[OWNER/episode-holding]` was not an accessible concrete repository. The existing writable `tkuchukhidze-maker/episodeholding` is used for this Phase 1 PR. Its prior Next.js main branch remains intact until this PR is merged; importing Laravel at root replaces that runtime, not its data.

**Checks:** CI must run; no local Composer install was possible in this sandbox. Lockfiles must be generated and committed before production deployment. Do not treat an installed scaffold as an enabled hospitality application.
