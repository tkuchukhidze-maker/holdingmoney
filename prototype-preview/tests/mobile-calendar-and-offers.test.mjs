import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { VenueCollection } from '../src/venue-collections.js';
import { injectVenueOffer } from '../src/venue-offer-section.js';
import { offerForVenue } from '../src/daily-offers.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'src/mobile-experience.css'), 'utf8');

test('restaurant directory is for choosing branches, not advertising a selected venue', () => {
  const html = renderToString(React.createElement(VenueCollection, { kind: 'restaurants' }));
  assert.match(html, /აირჩიეთ რესტორანი/);
  for (const slug of ['batumi','kutaisi','tbilisi']) assert.match(html, new RegExp('href="/restaurants/' + slug + '"'));
  assert.doesNotMatch(html, /ხინკლის შუადღე/);
  assert.doesNotMatch(html, /12:00–17:00/);
  assert.doesNotMatch(html, /ec-offer-highlight/);
});

test('promotion is scoped to restaurant detail and appears before its menu, not on hotels', () => {
  for (const screen of ['Batumi', 'Kutaisi', 'Tbilisi']) {
    const original = readFileSync(resolve(root, 'design/project/' + screen + '.dc.html'), 'utf8');
    const adapted = injectVenueOffer(screen, original);
    assert.notEqual(original, adapted);
    assert.match(adapted, /<section id="daily-offer" class="ec-venue-offer"/);
    assert.match(adapted, /შეთავაზების პროექტი — ჯერ არ მოქმედებს/);
    assert.match(adapted, /12:00–17:00/);
    assert.match(adapted, new RegExp('href="/restaurants/' + screen.toLowerCase() + '/menu#daily-offer"'));
    assert.ok(adapted.indexOf('id="daily-offer"') < adapted.indexOf('id="menu"'));
    assert.equal((adapted.match(/id="daily-offer"/g) || []).length, 1);
    assert.equal(offerForVenue(screen.toLowerCase()).status, 'draft');
  }
  for (const screen of ['Main', 'Magnolia', 'ChateauMere']) {
    const original = readFileSync(resolve(root, 'design/project/' + screen + '.dc.html'), 'utf8');
    assert.equal(injectVenueOffer(screen, original), original);
  }
});

test('mobile calendar stays a seven-column month rather than tall day list', () => {
  // Regression for the overly broad #root [style*="grid-template-columns: repeat("]
  // rule that collapsed every calendar column on iPhone.
  assert.doesNotMatch(css, /#root \[style\*="grid-template-columns: repeat\("\]/);
  assert.match(css, /#root \[style\*="grid-template-columns: repeat\(auto-fit"/);
  for (const screen of ['Batumi', 'Kutaisi', 'Tbilisi']) {
    const html = readFileSync(resolve(root, 'design/project/' + screen + '.dc.html'), 'utf8');
    assert.match(html, /id="calendar"/);
    assert.match(html, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
    assert.match(css, new RegExp('body\\[data-episode-screen="' + screen + '"\\] #calendar'));
  }
  for (const screen of ['Magnolia', 'ChateauMere']) {
    const html = readFileSync(resolve(root, 'design/project/' + screen + '.dc.html'), 'utf8');
    assert.match(html, /id="booking"/);
    assert.match(html, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
    assert.match(css, new RegExp('body\\[data-episode-screen="' + screen + '"\\] #booking'));
  }
  assert.match(css, /grid-template-columns:repeat\(7,minmax\(0,1fr\)\)!important/);
  assert.match(css, /#calendar \.cal-cell, #booking \.cal-cell/);
  assert.match(css, /min-height:44px!important/);
});
