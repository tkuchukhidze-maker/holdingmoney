# Episode Holding — Full Source Export

**Exported:** 2026-10-12
**Concept:** *EPISODE — One Account. Every Experience.*

## What this project is (read first)

**This project is a set of Claude Design prototypes plus a standalone open-source viewer. It is not a working production application.**

| Question | Answer |
|---|---|
| Is there a Laravel backend? | **No.** No backend code of any kind has been written. |
| Is there a React / Next.js app? | **Only the viewer.** `src/` is a small React-based runtime written for this export, so that the prototypes run outside Claude. It is not the product application. |
| Is there a database? | **No.** No schema, migrations or seeders exist. `DATABASE_SCHEMA.md` is a *proposed* model derived from the prototypes. |
| Is anything deployed? | **No.** |
| GitHub | The target repo `tkuchukhidze-maker/episodeholding` could not be accessed from the export session (private, and no GitHub account linked). Nothing was pushed. |
| Real data / secrets | **None.** All people, bookings and figures are sample data. No keys, tokens or `.env` exist. |

The nine `.dc.html` files in `design/project/` are the **approved design specification**. They are byte-identical to the live Claude Design canvas (version `1791803112-0c8b`). Each file contains the complete markup, Georgian copy, styling and interaction logic (`renderVals`, `setState`, event handlers) for one screen.

## Quick start

Requires **Node.js 20+**.

```bash
npm install                      # creates package-lock.json on first run (see MISSING.md)
npm run dev                      # http://localhost:5173 — index of all 9 screens
npm run build                    # static build in dist/
npm test                         # syntax check + design validation + build + browser smoke test
npx playwright install chromium  # once, before npm test / npm run test:smoke
```

Open a screen directly with `?screen=Main`, `?screen=Batumi`, `?screen=Admin`, etc. Links between screens work, and a small "Screens" switcher sits bottom-left.

## Project structure

```
design/project/        9 approved prototypes (.dc.html) + canvas.json (screen index)
src/dc-parse.js        standalone runtime: HTML parser, {{holes}}, sc-for, sc-if, styles, events, DCLogic
src/dc-runtime.js      browser mounting: fetch screen, inject fonts/CSS, render, link rewriting, viewer bar
src/main.js            entry: ?screen=Name → mount, otherwise screen index
index.html             viewer shell
scripts/build.mjs      esbuild bundle + copy design files → dist/ (also dev server with --serve)
tests/validate-designs.mjs  Node: every screen compiles, renders (react-dom/server), links resolve
tests/smoke.mjs        Chromium: every screen loads without errors + one key interaction each
tools/make_houses.py   regenerates Kutaisi + Tbilisi from the Batumi template
tools/make_chateau.py  regenerates Chateau Mere from the Magnolia template
```

The full file list is in `PROJECT_TREE.txt`.

## Technology

- **Prototype format:** Claude Design "Design Components". Markup lives in `<x-dc>` with `{{dotted.path}}` holes, `<sc-for list as>` loops, `<sc-if value>` conditionals and `<helmet>` for fonts and CSS. Logic is a class `Component extends DCLogic` with React class semantics. Full description in `DESIGN_SPEC.md`.
- **Viewer:**
  - React 19.2.8 and react-dom 19.2.8
  - esbuild 0.28.2 (bundling and dev server)
  - Playwright 1.56.0 (smoke test)
  - no other dependencies
- **Fonts (Google Fonts, loaded by each screen):** Hanken Grotesk, Instrument Serif, Noto Sans Georgian.
- **Claude's `support.js`:** proprietary to the Claude Design tool, so it is *not* included. `src/dc-parse.js` is an independent implementation of the features these nine files use.

## Regenerating template screens

Batumi → Kutaisi/Tbilisi, and Magnolia → Chateau Mere, are generated:

```bash
python3 tools/make_houses.py design    # after editing design/project/Batumi.dc.html
python3 tools/make_chateau.py design   # after editing design/project/Magnolia.dc.html
```

Both scripts reproduce the current files byte-for-byte (verified).

## Documents

| File | Contents |
|---|---|
| `IMPLEMENTATION_STATUS.md` | What works, what is simulated, what is not built |
| `DESIGN_SPEC.md` | All 9 prototypes → proposed routes, components, styles, state and interactions |
| `DATABASE_SCHEMA.md` | Proposed entities and relationships (no migrations exist) |
| `MISSING.md` | Everything still needed for production |
| `DEPLOY.md` | How to deploy the viewer today; requirements for the future application |
| `HANDOFF.md` | Instructions for the next engineer / AI assistant |
| `PROJECT_TREE.txt` | Exported folder structure |
