# Approved design source registry

Archive: `episode-holding-complete-project.zip` (provided by Episode Holding on 2026-10-12).

The full archive was inspected before authoring Phase 1. It contains nine uncompiled `.dc.html` Design Components, plus `README.md`, `MISSING.md`, `design/project/canvas.json`, and two generation scripts. The design runtime `support.js` and all production application code are absent.

Each prototype has an `<x-dc>` view and `<script type="text/x-dc" data-dc-script>` containing `renderVals`/`setState` behaviour. **Do not use these files directly as browser-ready HTML**. Their exact source bytes and associated archive must be preserved while porting each UI.

| Prototype | SHA-256 |
| --- | --- |
| Main.dc.html | abc8b6436542b722d064dfa4dd251caba58c642c94ba29141fb4f5b68af524ce |
| Batumi.dc.html | cccd05f3d2d54106d7b3405a5f6b0df448f5ecdb0b7b99d51c1e8219239a472a |
| Kutaisi.dc.html | c1b0eaf70a398c739a5732ab9dc9c2a4b4d2683a2693e94b9b1ec05f9a30d26d |
| Tbilisi.dc.html | 4428b99d63ca05b0f321b9128006522dc32376a0c748b110569ca5463a920ca7 |
| Magnolia.dc.html | 02d7f5cb2256340491f8965294935a4f2e6c62611f6c92afad9df7cb93b5d99f |
| ChateauMere.dc.html | a2f23d4b73ea146c754d87c226d89456a42dacbaeb7b7a1959332c57cc7c7d0c |
| Register.dc.html | 0192245a276236812e3a64ee4ac9654a39aa9e4b4d549b1251e0ccce91896811 |
| MyEpisode.dc.html | 5f415309d1573dc1bd1264df24b0fbd871689b93e1b810c7781c44663a1c20bc |
| Admin.dc.html | 39e845f9bf419ba16ec9c73adb64bbb7c2c30f5731c06e6dae51613d0e8d2714 |

These hashes reference the ZIP attachment, which must be imported into the repository before implementing the screen ports. The companion downloadable Phase 1 source package retains all nine original prototype files verbatim.

## Palette and typography

- Ground `#F5F1EA`; Surface `#FFFDF9`; Ink `#1F1A17`; Muted `#5E5650`; Line `#E4DCD1`.
- Holding `#8E2C3A`; Batumi `#1F4E63`; Kutaisi `#7A5418`; Tbilisi `#6E3326`; Magnolia `#6A3D5E`; Chateau Mere `#4A5D3F`.
- Google Fonts: Hanken Grotesk (Latin UI), Instrument Serif (italic accent), Noto Sans Georgian (Georgian).

## Phase ownership

- Phase 4 ports `Main`, `Batumi`, `Kutaisi`, `Tbilisi`, `Magnolia`, `ChateauMere`.
- Phase 5 ports `Register` and `MyEpisode`.
- Phase 6 ports `Admin` in full, including per-venue scope and permission matrix.

Never substitute random photos, prices, artist names, addresses or room types for bracketed placeholders.
