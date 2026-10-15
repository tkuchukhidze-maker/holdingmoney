// Browser smoke test: serves dist/ (run `npm run build` first), opens every
// prototype in Chromium, checks it renders without runtime errors and
// exercises one key interaction per screen.
//
// Browser: uses Playwright's Chromium. Install once with `npx playwright install chromium`,
// or point CHROMIUM_PATH at an existing Chromium/Chrome binary.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error('dist/ missing — run npm run build first'); process.exit(1); }
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = path.join(dist, u.endsWith('/') ? u + 'index.html' : u);
  if (!f.startsWith(dist) || !fs.existsSync(f)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port + '/';
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

const cases = [
  ['Main', 'One account.', async (pg) => { await pg.getByRole('tab', { name: 'Book a Room' }).click(); await pg.getByText('Check availability').waitFor(); }],
  ['Batumi', 'ვინ მღერის დღეს?', async (pg) => { await pg.locator('button[aria-label^="17 ოქტომბერი"]').click(); await pg.getByText('შაბათი, 17 ოქტომბერი').first().waitFor(); }],
  ['Kutaisi', 'ქუთაისის სახლში', async (pg) => { await pg.getByRole('button', { name: 'დღეს ვინ მღერის?' }).click(); await pg.getByText('დღეს, 12 ოქტომბერს').waitFor({ timeout: 3000 }); }],
  ['Tbilisi', 'თბილისის სახლში', async (pg) => { await pg.getByRole('link', { name: 'ჯავშნის მოთხოვნა და მენიუს შედგენა' }).waitFor(); }],
  ['Magnolia', 'Magnolia', async (pg) => { if (await pg.getByRole('button', { name: 'შემდეგი ფოტო' }).count()) throw new Error('Unpublished gallery controls still visible'); }],
  ['ChateauMere', 'Chateau', async (pg) => { await pg.getByRole('tab', { name: 'სპა ცენტრი' }).click(); await pg.getByRole('heading', { name: 'სპა ცენტრი' }).waitFor(); }],
  ['Register', 'My Episode', async (pg) => { await pg.getByText('ანგარიშის შექმნა და შესვლა ჯერ არ არის გააქტიურებული.', { exact: false }).waitFor(); }],
  ['MyEpisode', 'My Episode', async (pg) => { if (await pg.getByText('გამარჯობა, თოკო').count()) throw new Error('Guest must not see a fabricated account'); }],
  ['Admin', 'მართვის პანელი მიუწვდომელია', async (pg) => { if (await pg.getByLabel('ნახვა როგორც').count()) throw new Error('Public preview must not offer role switching'); }]
];

let failed = 0;
for (const [screen, expectText, interact] of cases) {
  const pg = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  let warnings = 0;
  let network = 0; // e.g. Google Fonts unreachable offline, favicon 404 — not code errors
  pg.on('pageerror', (e) => errors.push(e.message));
  pg.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource/.test(t)) network++;
    else if (/Warning:/.test(t)) warnings++;
    else errors.push(t);
  });
  let status = 'PASS';
  let note = '';
  try {
    await pg.goto(base + '?screen=' + screen, { waitUntil: 'networkidle' }).catch(() => pg.goto(base + '?screen=' + screen));
    await pg.getByText(expectText).first().waitFor({ timeout: 8000 });
    await interact(pg);
    if (errors.length) { status = 'FAIL'; note = errors.slice(0, 3).join(' | '); }
  } catch (e) {
    status = 'FAIL';
    note = (e && e.message || String(e)).split('\n')[0];
  }
  if (status === 'FAIL') failed++;
  console.log(status + ' ' + screen.padEnd(12) + (warnings ? warnings + ' React warning(s) ' : '') + (network ? network + ' network resource(s) unavailable ' : '') + note);
  await pg.close();
}

await browser.close();
server.close();
console.log('\n' + (cases.length - failed) + '/' + cases.length + ' screens passed');
process.exit(failed ? 1 : 0);
