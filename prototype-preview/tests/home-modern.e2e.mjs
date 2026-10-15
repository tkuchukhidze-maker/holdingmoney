import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { chromium } from 'playwright';

test('modern homepage preserves booking context and uses fingerprinted assets', { timeout: 60000 }, async () => {
  const socket = createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(r => socket.close(r));
  const server = spawn(process.execPath, ['server.mjs'], { cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    await once(server.stdout, 'data'); browser = await chromium.launch();
    const page = await browser.newPage(); await page.route('https://fonts.googleapis.com/**', r => r.abort());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const base = `http://127.0.0.1:${port}`;
    for (const width of [320, 390, 744, 1280]) {
      await page.setViewportSize({ width, height: 844 }); await page.goto(base);
      await page.getByRole('heading', { name: /ახალი მოგონება/ }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.equal(await page.locator('.episode-status').count(), 0);
      if (width <= 744) assert.equal(await page.locator('.eh-desktop-nav').isVisible(), false);
      assert.equal(await page.locator('#episode-mobile-navigation svg').count(), 4);
      assert.equal(await page.locator('#episode-mobile-navigation .episode-mobile-icon:not(svg)').count(), 0);
    }
    const version = await (await page.request.get(base + '/version.json')).json();
    for (const path of Object.values(version.assets)) {
      assert.match(path, /\.[0-9a-f]{12}\.(js|css)$/);
      assert.equal((await page.request.get(base + path)).status(), 200);
    }
    const html = await page.content(); assert.ok(html.includes(version.assets['main.js']));
    assert.ok(!html.includes('src="/assets/main.js"'));
    await page.getByLabel('რესტორანი', { exact: true }).selectOption('kutaisi');
    await page.getByLabel('ვიზიტის თარიღი').fill('2099-10-20');
    await page.getByLabel('ვიზიტის დრო').fill('20:30');
    await page.getByLabel('სტუმრების რაოდენობა', { exact: true }).fill('12');
    await page.getByRole('button', { name: 'გაგრძელება', exact: true }).click();
    await page.waitForURL('**/restaurants/kutaisi/book?**');
    assert.equal(await page.getByLabel('თარიღი', { exact: true }).inputValue(), '2099-10-20');
    assert.equal(await page.getByLabel('დრო', { exact: true }).inputValue(), '20:30');
    assert.equal(await page.getByLabel('სტუმრების რაოდენობა', { exact: true }).inputValue(), '12');
    await page.goto(base); await page.getByRole('button', { name: 'ოთახი', exact: true }).click();
    await page.getByLabel('სასტუმრო', { exact: true }).selectOption('chateau-mere');
    await page.getByRole('button', { name: 'სასტუმროს ნახვა' }).click();
    await page.waitForURL('**/hotels/chateau-mere#booking');
    assert.deepEqual(errors, []);
  } finally { await browser?.close(); server.kill(); }
});
