import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const previewRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(previewRoot, '..');

function availablePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolvePort(address.port));
    });
  });
}

async function requestAfterStartup(url, options = {}) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      return await fetch(url, { signal: AbortSignal.timeout(900), ...options });
    } catch (error) {
      if (attempt === 59) throw error;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 75));
    }
  }
  throw new Error('Server did not become ready');
}

test('Cloud start command answers readiness probes and serves all approved screens', async () => {
  const port = await availablePort();
  // Intentionally start with a different cwd, exactly as a monorepo
  // deployment can be launched by the platform.
  const app = spawn(process.execPath, [resolve(previewRoot, 'server.mjs')], {
    cwd: repositoryRoot,
    env: { ...process.env, PORT: String(port), HOST: '::' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  app.stderr.on('data', (data) => { stderr += data.toString(); });

  try {
    for (const route of ['/', '/up', '/health', '/healthz']) {
      const response = await requestAfterStartup('http://127.0.0.1:' + port + route);
      assert.equal(response.status, 200, route + ' did not return 200: ' + stderr);
      assert.match(response.headers.get('content-type') || '', /text\/html/);
    }
    // Laravel Cloud uses IPv6 for its readiness probe. The same listener
    // must respond over both IPv6 and IPv4 (Linux dual-stack).
    for (const route of ['/', '/up', '/health', '/healthz']) {
      const response = await requestAfterStartup('http://[::1]:' + port + route);
      assert.equal(response.status, 200, 'IPv6 readiness failed at ' + route + ': ' + stderr);
      assert.match(response.headers.get('content-type') || '', /text\/html/);
    }
    const publicPages = [
      '/screens', '/restaurants', '/hotels',
      '/restaurants/batumi/menu', '/restaurants/kutaisi/menu', '/restaurants/tbilisi/menu', '/restaurants/batumi', '/restaurants/kutaisi',
      '/restaurants/tbilisi', '/hotels/magnolia', '/hotels/chateau-mere',
      '/register', '/my-episode', '/admin', '/account', '/places/batumi',
    ];
    for (const path of publicPages) {
      const response = await requestAfterStartup('http://127.0.0.1:' + port + path);
      assert.equal(response.status, 200, path + ': direct navigation failed');
      assert.match(response.headers.get('content-type') || '', /text\/html/);
    }
    assert.equal((await requestAfterStartup('http://127.0.0.1:' + port + '/not-a-page')).status, 404);
    const homepage = await requestAfterStartup('http://127.0.0.1:' + port + '/');
    const html = await homepage.text();
    assert.match(html, /<title>Episode Holding —/);
    assert.ok(html.includes('src="/assets/main.js"'), "Nested routes must load assets from the domain root");
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.ok(!html.includes("Episode Holding — Prototypes"));
    const stylesheet = await requestAfterStartup('http://127.0.0.1:' + port + '/assets/venue-collections.css');
    assert.equal(stylesheet.status, 200);
    assert.match(stylesheet.headers.get('content-type') || '', /text\/css/);
    assert.match(await stylesheet.text(), /ec-grid/);
    for (const logo of ['batumis-sakhlshi.png', 'kutaisis-sakhlshi.png']) {
      const image = await requestAfterStartup('http://127.0.0.1:' + port + '/brand/' + logo);
      assert.equal(image.status, 200, 'restaurant branch logo failed: ' + logo);
      assert.match(image.headers.get('content-type') || '', /image\/png/);
    }
    const menuCSS = await requestAfterStartup('http://127.0.0.1:' + port + '/assets/restaurant-menu.css');
    assert.equal(menuCSS.status, 200);
    assert.match(menuCSS.headers.get('content-type') || '', /text\\/css/);
    assert.match(await menuCSS.text(), /ecm-basket/);
    const compiledMenu = await requestAfterStartup('http://127.0.0.1:' + port + '/assets/main.js');
    assert.equal(compiledMenu.status, 200);
    assert.match(await compiledMenu.text(), /Batumis|ბათუმის სახლში/);
    const head = await requestAfterStartup('http://127.0.0.1:' + port + '/', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    const canvas = await requestAfterStartup('http://127.0.0.1:' + port + '/project/canvas.json');
    assert.equal(canvas.status, 200);
    assert.equal((await canvas.json()).order.length, 9);
    const script = await requestAfterStartup('http://127.0.0.1:' + port + '/assets/main.js');
    assert.equal(script.status, 200);
    assert.match(script.headers.get('content-type') || '', /javascript/);
  } finally {
    app.kill('SIGTERM');
  }
});
