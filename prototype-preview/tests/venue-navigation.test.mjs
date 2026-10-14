import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { VENUE_COLLECTIONS, VenueCollection } from '../src/venue-collections.js';
import { prepareSiteNavigation } from '../src/site-landing-links.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const approvedMain = readFileSync(resolve(root, 'design/project/Main.dc.html'), 'utf8');

test('approved main remains unmodified and website category navigation changes only in memory', () => {
  assert.match(approvedMain, /href="#houses"[^>]+>Restaurants<\/a>/);
  assert.match(approvedMain, /href="#houses"[^>]+>Hotels<\/a>/);
  const home = prepareSiteNavigation('Main', approvedMain);
  assert.match(home, /href="\/restaurants"[^>]+>Restaurants<\/a>/);
  assert.match(home, /href="\/hotels"[^>]+>Hotels<\/a>/);
  assert.equal((home.match(/href="\/restaurants"(?=[^>]*min-height: 540px;)/g) || []).length, 1);
  assert.equal((home.match(/href="\/hotels"(?=[^>]*min-height: 540px;)/g) || []).length, 1);
  assert.match(home, /href="\/restaurants\/batumi"[^>]*>Batumis Sakhlshi<\/a>/);
  assert.match(home, /href="\/restaurants\/kutaisi"[^>]*>Kutaisis Sakhlshi<\/a>/);
  assert.match(home, /href="\/restaurants\/tbilisi"[^>]*>Tbilisis Sakhlshi<\/a>/);
  assert.match(home, /href="\/hotels\/magnolia"[^>]*>Hotel Magnolia<\/a>/);
  assert.match(home, /href="\/hotels\/chateau-mere"[^>]*>Chateau Mere<\/a>/);
  assert.match(home, /href="\/restaurants"[^>]*>Find a table<\/a>/);
  assert.match(home, /href="\/hotels"[^>]*>Check availability<\/a>/);
  assert.equal(prepareSiteNavigation('Batumi', approvedMain), approvedMain);
});

test('restaurants page offers exactly our three branches without invented pricing', () => {
  const data = VENUE_COLLECTIONS.restaurants;
  assert.deepEqual(data.venues.map((v) => v.href), [
    '/restaurants/batumi',
    '/restaurants/kutaisi',
    '/restaurants/tbilisi',
  ]);
  const html = renderToString(React.createElement(VenueCollection, { kind: 'restaurants' }));
  for (const name of ['ბათუმის სახლში', 'ქუთაისის სახლში', 'თბილისის სახლში']) {
    assert.ok(html.includes(name), 'Missing branch: ' + name);
  }
  assert.ok(html.includes('href="/restaurants/batumi"'));
  assert.ok(html.includes('href="/restaurants/kutaisi"'));
  assert.ok(html.includes('href="/restaurants/tbilisi"'));
  assert.ok(html.includes('/brand/batumis-sakhlshi.png'));
  assert.ok(html.includes('/brand/kutaisis-sakhlshi.png'));
  assert.ok(!html.includes('₾'));
  assert.ok(!html.includes('Available tables'));
});

test('hotels remain a separate choice page', () => {
  const data = VENUE_COLLECTIONS.hotels;
  assert.deepEqual(data.venues.map((v) => v.href), ['/hotels/magnolia', '/hotels/chateau-mere']);
  const html = renderToString(React.createElement(VenueCollection, { kind: 'hotels' }));
  assert.ok(html.includes('სასტუმრო მაგნოლია'));
  assert.ok(html.includes('შატო მერე'));
  assert.ok(!html.includes('ბათუმის სახლში'));
});
