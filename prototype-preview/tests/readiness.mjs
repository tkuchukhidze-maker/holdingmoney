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
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
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
    const publicPages = [
      '/screens', '/restaurants/batumi', '/restaurants/kutaisi',
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
    assert.match(html, /src="\\/assets\\/main\\.js"/);
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch(html, /<title>Episode Holding — Prototypes<\\/title>/);
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
