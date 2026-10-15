import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);

test('public routes, mobile navigation, anchors, blocked storage and menu drafts', { timeout: 120000 }, async () => {
  const socket = createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(r => socket.close(r));
  const server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    await once(server.stdout, 'data');
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const base = `http://127.0.0.1:${port}`;
    for (const width of [320, 390, 744, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of ['/', '/restaurants', '/hotels', '/restaurants/batumi', '/restaurants/kutaisi', '/restaurants/tbilisi', '/hotels/magnolia', '/hotels/chateau-mere', '/restaurants/batumi/menu', '/register', '/my-episode']) {
        await page.goto(base + route);
        await page.locator('#root h1').first().waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + ' overflows at ' + width);
        if (width <= 744) {
          const links = page.locator('#episode-mobile-navigation a');
          assert.equal(await links.count(), 4);
          assert.equal(await page.locator('#episode-mobile-navigation svg').count(), 4);
          const rect = await links.first().boundingBox(); assert.ok(rect.height >= 44);
          const expected = route.startsWith('/restaurants') ? '/restaurants' : route.startsWith('/hotels') ? '/hotels' : route === '/' ? '/' : '/my-episode';
          assert.equal(await page.locator('#episode-mobile-navigation [aria-current="page"]').getAttribute('href'), expected);
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/restaurants/batumi#booking');
    await page.locator('#booking').waitFor();
    await page.waitForFunction(() => Math.abs(document.getElementById('booking').getBoundingClientRect().top) < 100);
    assert.ok(await page.locator('#root a[href="/restaurants/batumi/menu"]').count());
    await page.goto(base + '/my-episode');
    assert.equal(await page.getByText('გამარჯობა, თოკო').count(), 0);
    await page.goto(base + '/register');
    assert.equal(await page.locator('input').count(), 0);
    // sessionStorage getters can throw before getItem/setItem is called.
    await page.addInitScript(() => Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }));
    await page.goto(base + '/restaurants/batumi/menu');
    const plus = page.getByRole('button', { name: /რაოდენობის გაზრდა/ }).first();
    await plus.click();
    assert.match(await page.locator('.ecm-lines').innerText(), /× 1/);
    assert.ok((await plus.boundingBox()).height >= 44);
    await page.getByRole('button', { name: 'არჩევანის გასუფთავება' }).click();
    await page.getByRole('button', { name: 'გასუფთავების გაუქმება' }).click();
    assert.match(await page.locator('.ecm-lines').innerText(), /× 1/);
    await page.getByLabel('სტუმრების რაოდენობა', { exact: true }).fill('0');
    await page.getByRole('button', { name: 'ტექსტის ჩვენება', exact: true }).click();
    assert.equal(await page.locator('.ecm-export').count(), 0);
    await page.getByLabel('სტუმრების რაოდენობა', { exact: true }).fill('2');
    await page.getByRole('button', { name: 'ტექსტის ჩვენება', exact: true }).click();
    assert.match(await page.locator('.ecm-export').inputValue(), /ბათუმის სახლში/);
    const url = page.url();
    await page.getByLabel('სახელი და გვარი', { exact: true }).fill('Test Guest');
    await page.getByLabel('სახელი და გვარი', { exact: true }).press('Enter');
    assert.equal(page.url(), url);
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); server.kill(); }
});
