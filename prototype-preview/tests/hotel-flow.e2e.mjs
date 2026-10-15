import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

async function listen(s) { s.listen(0, '127.0.0.1'); await once(s, 'listening'); return s.address().port; }
test('hotel room recommendations, selection, assistance and booking handoff', { timeout: 90000 }, async () => {
  const requests = [];
  const api = createServer(async (req, res) => {
    assert.equal(req.url, '/api/hotel-booking-requests'); assert.equal(req.headers.authorization, 'Bearer test-hotel');
    const chunks = []; for await (const c of req) chunks.push(c); requests.push(JSON.parse(Buffer.concat(chunks)));
    res.writeHead(201, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ reference: 'EH-TEST-ONLY', status: 'pending' }));
  });
  const apiPort = await listen(api); const temp = createServer(); const port = await listen(temp); await new Promise(r => temp.close(r));
  const server = spawn(process.execPath, ['server.mjs'], { cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', BOOKING_API_URL: `http://127.0.0.1:${apiPort}/api/booking-requests`, BOOKING_API_TOKEN: 'test-hotel' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    await once(server.stdout, 'data'); browser = await chromium.launch(); const page = await browser.newPage();
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    const errors = []; page.on('pageerror', e => errors.push(e.message)); const base = `http://127.0.0.1:${port}`;
    const search = async () => {
      await page.getByLabel('შესვლის თარიღი', { exact: true }).fill('2099-10-20');
      await page.getByLabel('გასვლის თარიღი', { exact: true }).fill('2099-10-23');
      await page.getByRole('button', { name: 'შემირჩიეთ ნომერი' }).click();
    };
    for (const width of [320, 390, 744, 1280]) {
      await page.setViewportSize({ width, height: 844 }); await page.goto(base + '/hotels/magnolia/book');
      await search(); assert.ok(await page.locator('.eh-room-card').count() > 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.equal(await page.locator('#episode-mobile-navigation [aria-current="page"]').getAttribute('href'), '/hotels');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('ბავშვები', { exact: true }).fill('1'); await search();
    assert.equal(await page.locator('.eh-room-card').count(), 1); assert.match(await page.locator('.eh-room-card').innerText(), /Standard Triple/);
    await page.getByRole('button', { name: 'ამ ნომრის არჩევა', exact: true }).click();
    await page.getByLabel('სახელი და გვარი', { exact: true }).fill('Test Hotel Guest'); await page.getByLabel('ტელეფონი', { exact: true }).fill('+995599123456');
    // Editing criteria invalidates the selected room, preserving contact input.
    await page.getByLabel('მოზრდილები', { exact: true }).fill('6');
    assert.equal(await page.locator('#hotel-contact').count(), 0);
    await search(); await page.getByRole('button', { name: 'განვიხილოთ 3 ნომერი' }).click();
    await page.getByRole('button', { name: 'ამ ნომრის არჩევა', exact: true }).first().click();
    assert.equal(await page.getByLabel('სახელი და გვარი', { exact: true }).inputValue(), 'Test Hotel Guest');
    await page.getByRole('button', { name: 'მოთხოვნის გაგზავნა სასტუმროში' }).click();
    await page.getByRole('heading', { name: 'მოთხოვნა მიღებულია' }).waitFor();
    assert.equal(requests.length, 1); assert.equal(requests[0].adults, 6); assert.equal(requests[0].children, 1); assert.equal(requests[0].roomCount, 3); assert.equal(requests[0].checkOut, '2099-10-23'); assert.ok(requests[0].roomId);
    await page.goto(base + '/hotels/chateau-mere/book'); await search();
    assert.equal(await page.locator('.eh-room-card').count(), 0);
    await page.getByRole('button', { name: 'შერჩევაში სასტუმრო დამეხმაროს' }).click();
    await page.getByLabel('სახელი და გვარი', { exact: true }).fill('Test Other Guest'); await page.getByLabel('ტელეფონი', { exact: true }).fill('+995599123456');
    await page.getByRole('button', { name: 'მოთხოვნის გაგზავნა სასტუმროში' }).click(); await page.getByRole('heading', { name: 'მოთხოვნა მიღებულია' }).waitFor();
    assert.equal(requests[1].venue, 'chateau-mere'); assert.equal(requests[1].roomId, null);
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); server.kill(); await new Promise(r => api.close(r)); }
});
