import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function freePort() {
  return new Promise((accept, reject) => {
    const s = createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => s.close(() => accept(s.address()?.port)));
  });
}

test('390px phone: all three restaurant and both hotel calendars render as compact 7-column months', { timeout: 120000 }, async () => {
  const port = await new Promise((resolvePort, reject) => {
    const s = createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const address = s.address();
      s.close(() => resolvePort(address.port));
    });
  });
  const server = spawn(process.execPath, [resolve(root, 'server.mjs')], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: '::' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  server.stderr.on('data', chunk => { stderr += chunk.toString(); });
  let browser;
  try {
    for (let n = 0; n < 60; n++) {
      try {
        const response = await fetch('http://127.0.0.1:' + port + '/');
        if (response.ok) break;
      } catch {}
      await new Promise(done => setTimeout(done, 90));
    }
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const site = 'http://127.0.0.1:' + port;
    await page.goto(site + '/restaurants', { waitUntil: 'load' });
    await page.getByRole('heading', { name: 'აირჩიეთ რესტორანი' }).waitFor({ timeout: 15000 });
    assert.equal(await page.locator('.ec-offer-highlight').count(), 0,
      'Restaurant selection should not advertise a specific venue offer');

    for (const screen of ['batumi','kutaisi','tbilisi','magnolia','chateau-mere']) {
      const restaurant = ['batumi','kutaisi','tbilisi'].includes(screen);
      const url = site + (restaurant ? '/restaurants/' : '/hotels/') + screen;
      await page.goto(url, { waitUntil: 'load' });
      const cal = restaurant ? '#calendar' : '#booking';
      await page.locator(cal + ' .cal-cell').first().waitFor({ timeout: 20000 });
      const result = await page.evaluate((selector) => {
        const days = [...document.querySelectorAll(selector + ' .cal-cell')];
        const calendar = days[0]?.closest('[style*="grid-template-columns: repeat(7,"]');
        const styles = calendar && getComputedStyle(calendar);
        const columns = styles?.gridTemplateColumns.trim().split(/\\s+/) || [];
        const first = days[0]?.getBoundingClientRect();
        const seventh = days[6]?.getBoundingClientRect();
        const width = window.innerWidth;
        return { days: days.length, columns: columns.length, firstWidth: first?.width,
          inViewport: first && first.left >= -1 && first.right <= width + 1,
          gridWidth: calendar?.getBoundingClientRect().width };
      }, cal);
      assert.equal(result.columns, 7, screen + ': grid columns = ' + result.columns + ' ' + stderr);
      assert.ok(result.days >= 28, screen + ': missing most calendar dates');
      assert.ok(result.firstWidth >= 20 && result.firstWidth <= 64, screen + ': calendar day too wide');
      assert.ok(result.inViewport, screen + ': calendar overflows mobile viewport');

      if (restaurant) {
        assert.equal(await page.locator('#daily-offer').count(), 1,
          screen + ': venue-specific promotion missing');
        assert.equal(await page.locator('.ec-offer-highlight').count(), 0);
        assert.ok(await page.locator('#daily-offer').evaluate((el) => {
          const menu = document.getElementById('menu');
          return Boolean(menu && (el.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING));
        }), screen + ': offer must precede its own menu section');
      } else {
        assert.equal(await page.locator('#daily-offer').count(), 0,
          'Hotel pages must not show restaurant promotions');
      }
    }
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
});
