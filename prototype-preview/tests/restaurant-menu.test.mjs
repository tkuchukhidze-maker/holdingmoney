import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RESTAURANT_MENUS, menuFor, menuItem } from '../src/menu-data.js';
import { sanitizeDraft, saveDraft, readDraft, draftLines, draftTotal, makeRequestText, draftStorageKey } from '../src/menu-cart.js';
import { menuFromPath, MENU_PATHS } from '../src/screen-routes.js';

test('all three restaurant menus have separate routes and unique venue IDs', () => {
  assert.deepEqual(Object.keys(MENU_PATHS), ['batumi', 'kutaisi', 'tbilisi']);
  assert.equal(menuFromPath('/restaurants/batumi/menu'), 'batumi');
  assert.equal(menuFromPath('/restaurants/kutaisi/menu/'), 'kutaisi');
  assert.equal(menuFromPath('/restaurants/tbilisi/menu'), 'tbilisi');
  assert.equal(menuFromPath('/restaurants/batumi'), null);
  assert.equal(menuFromPath('/restaurants/unknown/menu'), null);
  assert.equal(new Set(Object.values(RESTAURANT_MENUS).map(m => m.venueKey)).size, 3);
});

test('Batumi menu includes the owners food bar wine sections with prices', () => {
  const menu = menuFor('batumi');
  assert.ok(menu.sections.length >= 20);
  assert.ok(menu.sections.reduce((n,s) => n + s.items.length, 0) >= 125);
  assert.deepEqual(new Set(menu.sections.map(s => s.group)), new Set(['food','bar','wine']));
  assert.equal(menu.serviceIncluded, true);
  const id = menu.sections.find(s => s.id === 'khinkali').items.find(x => x.name === 'ქალაქური').id;
  assert.equal(menuItem(menu, id).price, 2.4);
  assert.equal(menu.sections.find(s => s.id === 'main').items.find(x => x.name === 'ხბოს ოჯახური').price, 28);
  assert.equal(menu.sections.find(s => s.id === 'main').items.find(x => x.name === 'ღორის ოჯახური').price, 26);
});

test('other branches have no invented dishes or prices', () => {
  for (const slug of ['kutaisi', 'tbilisi']) {
    assert.equal(menuFor(slug).sections.length, 0);
    assert.equal(menuFor(slug).source, null);
    assert.equal(menuFor(slug).verifiedCurrent, false);
  }
  assert.equal(menuFor('unknown'), null);
});

function makeStorage() {
  const store = new Map();
  return {
    getItem(k) { return store.get(k) || null; },
    setItem(k,v) { store.set(k,String(v)); },
  };
}

test('quantities are sanitized, never stored under another venue and correct to cents', () => {
  const storage = makeStorage();
  assert.notEqual(draftStorageKey('batumi'), draftStorageKey('kutaisi'));
  const raw = {
    'khinkali-1': 8,
    'appetizers-1': 2,
    'unknown': 100,
    'khinkali-2': -2,
    'soups-1': 1000000,
  };
  const safe = saveDraft('batumi', raw, storage);
  assert.deepEqual(safe, { 'khinkali-1': 8, 'appetizers-1': 2, 'soups-1': 1000 });
  assert.deepEqual(readDraft('batumi', storage), safe);
  assert.deepEqual(readDraft('kutaisi', storage), {});
  assert.equal(draftLines('batumi', safe).length, 3);
  assert.equal(draftTotal(draftLines('batumi', { 'khinkali-1': 8, 'appetizers-1': 2 })), 89.2);
  assert.deepEqual(sanitizeDraft('tbilisi', { 'khinkali-1': 1 }), {});
});

test('restaurant pre-order preview carries venue identity, date, time and itemized menu but no false booking success', () => {
  const text = makeRequestText('batumi', { 'khinkali-1': 8, 'appetizers-1': 1 }, {
    date: '2026-10-20', time: '19:30', guests: 4, notes: 'ალერგენები გადაამოწმეთ',
  });
  for (const required of [
    'ბათუმის სახლში', 'ბათუმი', '2026-10-20', '19:30',
    'ქალაქური × 8', 'ქართული ყველის დაფა × 1', '54.20 ₾',
    'ეს არის სტუმრის მომზადებული მოთხოვნა და არა დადასტურებული ჯავშანი',
  ]) assert.ok(text.includes(required), 'Missing in message: ' + required);
  assert.throws(() => makeRequestText('kutaisi', {}), /No dishes selected/);
  assert.throws(() => makeRequestText('batumi', {}), /No dishes selected/);
});
