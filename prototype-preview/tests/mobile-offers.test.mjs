import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_OFFERS, giftPreview, isOfferLive, offerForVenue } from '../src/daily-offers.js';
import { MOBILE_TABS, mobileCurrentTab } from '../src/mobile-nav.js';
import { photosForVenue } from '../src/venue-gallery.js';

test('campaign is explicitly a draft and venue-specific across restaurants', () => {
  assert.deepEqual(Object.keys(DAILY_OFFERS).sort(), ['batumi', 'kutaisi', 'tbilisi']);
  assert.equal(new Set(Object.values(DAILY_OFFERS).map(o => o.id)).size, 3);
  for (const [slug, offer] of Object.entries(DAILY_OFFERS)) {
    assert.equal(offer.venueSlug, slug);
    assert.equal(offer.status, 'draft');
    assert.equal(offer.startTime, '12:00');
    assert.equal(offer.endTime, '17:00');
    assert.equal(offer.rewardThreshold, 5);
    assert.equal(offer.rewardQuantity, 1);
    assert.equal(isOfferLive(offer, new Date('2026-10-14T12:00:00+04:00'), slug), false);
  }
  assert.equal(offerForVenue('unknown'), null);
});

test('every five selected eligible khinkali only implies one example beer, never a real discount', () => {
  const offer = offerForVenue('batumi');
  assert.equal(giftPreview(0, offer), 0);
  assert.equal(giftPreview(4, offer), 0);
  assert.equal(giftPreview(5, offer), 1);
  assert.equal(giftPreview(9, offer), 1);
  assert.equal(giftPreview(10, offer), 2);
  assert.equal(giftPreview(-1, offer), 0);
  assert.equal(giftPreview(1.5, offer), 0);
  assert.equal(giftPreview(50, null), 0);
});

test('mobile navigation shows all core routes and highlights the right category', () => {
  assert.deepEqual(MOBILE_TABS.map(v => v.href), ['/', '/restaurants', '/hotels', '/my-episode']);
  assert.equal(mobileCurrentTab('/restaurants/batumi/menu'), '/restaurants');
  assert.equal(mobileCurrentTab('/hotels/magnolia'), '/hotels');
  assert.equal(mobileCurrentTab('/register'), '/my-episode');
  assert.equal(mobileCurrentTab('/'), '/');
});

test('every restaurant and hotel has a locally served illustrative photo tour', () => {
  for (const name of ['Batumi', 'Kutaisi', 'Tbilisi', 'Magnolia', 'ChateauMere']) {
    const photos = photosForVenue(name);
    assert.ok(photos.length >= 2, 'Expected at least two gallery photos: ' + name);
    assert.ok(photos.every(src => src.startsWith('/photos/') && src.endsWith('.webp')));
  }
  assert.deepEqual(photosForVenue('Unknown'), []);
});
