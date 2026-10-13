# Episode Holding — Laravel Cloud PREVIEW package

The two folders here serve different purposes:

- `original/EPISODE_HOLDING_FULL_SOURCE/` is an unchanged copy of the entire uploaded source archive.
- `preview-app/` is a corrected, deployment-ready **Node.js 22 preview** of the nine approved `.dc.html` prototypes. It is NOT Laravel or a production booking application.

## Corrected source issues

The supplied `scripts/build.mjs` previously copied `design/` to `dist/design/`, while `src/dc-runtime.js` loaded from `dist/project/`. The preview copy fixes the output to `dist/project/`. A dependency-free `server.mjs` and `npm start` script are added to serve the compiled viewer via the Cloud-provided PORT.

The original designs are copied **byte-for-byte** and have identical SHA-256 hashes.

## Deploy to Laravel Cloud preview (never current Production)

1. Import `preview-app/` into a **new Git branch / standalone preview repository** (not the existing project's production `main` branch).
2. In Laravel Cloud create a separate *preview application/environment* with Node.js 22 runtime (Laravel Cloud supports Next.js/Node in addition to Laravel). Point its application directory at `preview-app` or move the preview files to the repository root.
3. Build command: `npm install --no-audit --no-fund && npm run build`
4. Start command: `npm start` (Cloud injects `PORT`). You do not need any database or secrets to preview the screens.
5. Visit `/?screen=Main`, `/?screen=Batumi`, `/?screen=Kutaisi`, `/?screen=Tbilisi`, `/?screen=Magnolia`, `/?screen=ChateauMere`, `/?screen=Register`, `/?screen=MyEpisode`, `/?screen=Admin`.
6. Screen data is **fake**. Clicking Reserve/Save simulates behaviour only. DO NOT expose it as a live booking or payment system.

## Laravel 12 product (separate codebase)

The actual Laravel foundation is developed in GitHub PR #10 at `tkuchukhidze-maker/episodeholding`, `phase/01-laravel12-foundation`.
The Phase 1 PR is **not a complete hospitality platform**. Do not merge it into the existing production Next.js branch or run it against live data. Phases 2–8 still require backend models, OTP, reservations, admin, integrations and operational deployment.

For the Laravel Cloud dashboard link provided in this chat, the user must authorize access or use Cloud UI to create staging and configure runtime/build. There is no authenticated Laravel Cloud management integration in this conversation. Do not share login credentials or tokens in chat.


## Node readiness and port settings (October 2026)

The Preview HTTP server (not the Laravel PHP app) binds to `0.0.0.0` on Laravel Cloud's injected `PORT` environment variable. If no `PORT` is injected, it uses port `3000`, matching the startup/readiness port indicated by the October 13 Cloud deployment diagnosis.

- Runtime: Node.js 22
- Application directory: `/prototype-preview`
- Build: `npm ci && npm run build`
- Start command: `npm start` (`node server.mjs`)
- Readiness: GET `/`, `/up`, `/health`, or `/healthz` returns 200 **when** `dist/index.html` exists.
- The server resolves `dist/` relative to its file, not to the current working directory, so it works with Cloud monorepo deployments.
- Local test: `npm run test:cloud` validates all nine screens, builds assets, starts the real HTTP server and probes all readiness routes.

If Cloud still fails at **Updating environment stack**, open the deployment details and inspect the actual **Deployment logs** and **application startup logs**, not only AI diagnosis. Confirm Cloud routes its health probe to the injected `PORT` (or explicitly set `PORT=3000` in environment settings when Cloud supports it) and that the build artifacts are present in the deploy image. A Cloud infrastructure/update failure cannot be verified or resolved from a GitHub commit alone. Never assume a successful Build means a successful Deploy.
