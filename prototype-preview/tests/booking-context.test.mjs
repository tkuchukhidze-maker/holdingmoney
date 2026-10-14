import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOOKABLE_VENUES, venueForScreen, preventFakeBookingConfirmation } from '../src/booking-context.js';
import { compileScreen } from '../src/dc-parse.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('one customer can select distinct restaurant and hotel booking destinations', () => {
  assert.deepEqual(Object.keys(BOOKABLE_VENUES), ['Batumi', 'Kutaisi', 'Tbilisi', 'Magnolia', 'ChateauMere']);
  const keys = Object.values(BOOKABLE_VENUES).map(v => v.venueKey);
  assert.equal(new Set(keys).size, 5);
  for (const [screen, venue] of Object.entries(BOOKABLE_VENUES)) {
    assert.equal(venueForScreen(screen), venue);
    assert.ok(venue.route.startsWith(venue.kind === 'restaurant' ? '/restaurants/' : '/hotels/'));
    assert.equal(venue.collection, venue.kind === 'restaurant' ? '/restaurants' : '/hotels');
    assert.ok(venue.name.length > 3);
    assert.ok(venue.city.length > 3);
  }
  assert.equal(venueForScreen('Main'), null);
});

test('all booking prototypes preserve their original bytes and cannot fake confirmations', () => {
  for (const [screen, venue] of Object.entries(BOOKABLE_VENUES)) {
    const original = readFileSync(resolve(root, 'design/project/' + screen + '.dc.html'), 'utf8');
    const modified = preventFakeBookingConfirmation(screen, original);
    assert.notEqual(modified, original, screen + ': fake booking is still enabled');
    assert.match(original, /onClick="{{confirm}}"/);
    assert.doesNotMatch(modified, /onClick="{{confirm}}"/);
    assert.match(modified, /disabled="disabled"/);
    assert.match(modified, /ჯავშანი მალე გააქტიურდება/);
    assert.ok(modified.includes('თქვენი ჯავშანი'), screen + ': booking review missing');
    // Ensure the unchanged approved screen still compiles after a targeted
    // runtime override; no design editing or copied venue data.
    const compiled = compileScreen(modified);
    assert.equal(typeof compiled.Component, 'function');
  }
});
