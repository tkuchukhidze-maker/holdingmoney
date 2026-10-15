import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chromium } from 'playwright';

async function listen(server) { server.listen(0, '127.0.0.1'); await once(server, 'listening'); return server.address().port; }

test('photo-free pages and restaurant request flow with and without planned menus', { timeout: 120000 }, async () => {
  const received = []; let rejectNext = false;
  const api = createServer(async (req, res) => {
    assert.equal(req.headers.authorization, 'Bearer test-only');
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const payload = JSON.parse(Buffer.concat(chunks)); received.push(payload);
    res.setHeader('Content-Type', 'application/json');
    if (rejectNext) { rejectNext = false; res.writeHead(503); res.end('{}'); return; }
    res.writeHead(201); res.end(JSON.stringify({ reference: 'EP-TEST-ONLY', menuIncluded: payload.menu.length > 0 }));
  });
  const apiPort = await listen(api);
  const temporary = createServer(); const port = await listen(temporary); await new Promise(r => temporary.close(r));
  const site = spawn(process.execPath, ['server.mjs'], { cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', BOOKING_API_URL: `http://127.0.0.1:${apiPort}`, BOOKING_API_TOKEN: 'test-only' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    await once(site.stdout, 'data'); browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    const errors = []; const photoRequests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (r.resourceType() === 'image' && !new URL(r.url()).pathname.startsWith('/brand/')) photoRequests.push(r.url()); });
    const base = `http://127.0.0.1:${port}`;
    for (const route of ['/', '/restaurants', '/hotels', '/restaurants/batumi', '/restaurants/kutaisi', '/restaurants/tbilisi', '/hotels/magnolia', '/hotels/chateau-mere', '/restaurants/batumi/menu']) {
      await page.goto(base + route); await page.locator('#root h1').first().waitFor();
      assert.equal(await page.locator('img:not([src^="/brand/"])').count(), 0, route);
      assert.equal(await page.locator('button[aria-label="შემდეგი ფოტო"]').count(), 0);
    }
    assert.deepEqual(photoRequests, []);
    await page.goto(base + '/restaurants');
    assert.equal(await page.locator('img[src^="/brand/"]').count(), 2);
    assert.equal((await page.request.get(base + '/photos/batumi.webp')).status(), 404);
    const fill = async () => {
      await page.getByLabel('სახელი და გვარი', { exact: true }).fill('სატესტო სტუმარი');
      await page.getByLabel('ტელეფონი', { exact: true }).fill('+995599123456');
      await page.getByLabel('თარიღი', { exact: true }).fill('2099-10-20');
      await page.getByLabel('დრო', { exact: true }).fill('19:00');
      await page.getByLabel('სტუმრების რაოდენობა', { exact: true }).fill('10');
    };
    await page.goto(base + '/restaurants/batumi/book'); await fill();
    await page.getByRole('button', { name: 'ჯავშნის მოთხოვნის გაგზავნა', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible' }); assert.equal(received.length, 0);
    await page.getByRole('button', { name: 'კი, შევადგინოთ მენიუ' }).click();
    await page.getByRole('button', { name: 'შემომთავაზეთ 3 მენიუ' }).click();
    assert.equal(await page.locator('.ep-plan').count(), 3);
    await page.getByRole('button', { name: 'ამ მენიუს არჩევა' }).nth(1).click();
    await page.getByRole('button', { name: 'ჯავშნის გაგზავნა მენიუსთან ერთად' }).click();
    await page.getByRole('heading', { name: 'მოთხოვნა მიღებულია' }).waitFor();
    assert.equal(received.length, 1); assert.equal(received[0].guests, 10); assert.equal(received[0].budget, 100);
    assert.equal(received[0].fullName, 'სატესტო სტუმარი'); assert.ok(received[0].menu.length > 0);
    assert.equal(received[0].venue, 'batumi'); assert.deepEqual(Object.keys(received[0].menu[0]).sort(), ['itemId', 'quantity']);
    await page.goto(base + '/restaurants/kutaisi/book'); await fill();
    await page.getByRole('button', { name: 'ჯავშნის მოთხოვნის გაგზავნა', exact: true }).click();
    rejectNext = true;
    await page.getByRole('button', { name: 'არა, გაგზავნა მენიუს გარეშე' }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.getByLabel('სახელი და გვარი', { exact: true }).inputValue(), 'სატესტო სტუმარი');
    await page.getByRole('button', { name: 'ჯავშნის მოთხოვნის გაგზავნა', exact: true }).click();
    await page.getByRole('button', { name: 'არა, გაგზავნა მენიუს გარეშე' }).click();
    await page.getByRole('heading', { name: 'მოთხოვნა მიღებულია' }).waitFor();
    assert.equal(received[1].requestId, received[2].requestId); assert.deepEqual(received[2].menu, []); assert.equal(received[2].venue, 'kutaisi');
    for (const width of [320, 744, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(base + '/restaurants/batumi/menu');
      await page.getByRole('button', { name: 'შემომთავაზეთ 3 მენიუ' }).click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); site.kill(); await new Promise(r => api.close(r)); }
});
