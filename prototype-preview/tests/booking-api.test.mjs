import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { handleBookingRequest } from '../src/booking-api.mjs';

test('unconfigured intake cannot return fake success or expose credentials', async () => {
  const server = createServer((req, res) => handleBookingRequest(req, res, {}));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 503); assert.equal((await response.json()).reference, undefined);
  } finally { await new Promise(r => server.close(r)); }
});
