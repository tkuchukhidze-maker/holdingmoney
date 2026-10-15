import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HOTEL_ROOMS, recommendRooms, stayNights } from '../src/hotel-rooms.js';

test('rooms match total guests, requested rooms and bed preference', () => {
  const options = recommendRooms('magnolia', { adults: 2, children: 0, roomCount: 1, bed: 'twin', purpose: 'business' }).options;
  assert.deepEqual(options.map(r => r.id), ['twin']);
  const family = recommendRooms('magnolia', { adults: 2, children: 1, roomCount: 1, bed: 'any', purpose: 'family' }).options;
  assert.deepEqual(family.map(r => r.id), ['triple']);
  const large = recommendRooms('magnolia', { adults: 6, children: 0, roomCount: 1, bed: 'any', purpose: 'leisure' });
  assert.equal(large.options.length, 0); assert.equal(large.suggestedRooms, 2);
  const two = recommendRooms('magnolia', { adults: 6, children: 0, roomCount: 2, bed: 'any', purpose: 'leisure' });
  assert.equal(two.options[0].id, 'triple'); assert.equal(two.options[0].totalCapacity, 6);
});
test('missing catalogs, invalid dates and invalid counts do not create false offers', () => {
  assert.equal(recommendRooms('chateau-mere', { adults: 2, children: 0, roomCount: 1, bed: 'any', purpose: 'leisure' }).missingCatalog, true);
  assert.equal(stayNights('2026-10-15', '2026-10-17'), 2);
  for (const pair of [['2026-02-30','2026-03-03'],['2026-10-15','2026-10-15'],['2026-10-15','2026-10-14'],['2026-10-15','2028-01-01']]) assert.equal(stayNights(...pair), 0);
  for (const patch of [{ adults: 0 }, { children: -1 }, { adults: 10, children: 1 }, { roomCount: 1.5 }, { bed: 'unknown' }]) assert.throws(() => recommendRooms('magnolia', { adults: 2, children: 0, roomCount: 1, bed: 'any', purpose: 'leisure', ...patch }));
  assert.deepEqual(JSON.parse(readFileSync(new URL('../../database/catalog/hotel-rooms.json', import.meta.url))), HOTEL_ROOMS);
  assert.ok(!JSON.stringify(HOTEL_ROOMS).includes('price'));
});
