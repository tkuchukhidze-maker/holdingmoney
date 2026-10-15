import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { proposeMenu, OCCASIONS } from '../src/menu-planner.js';
import { RESTAURANT_MENUS, menuItem, menuFor } from '../src/menu-data.js';
import { draftTotal } from '../src/menu-cart.js';

test('plans scale to guest count and occasion using real prices within the chosen budget', () => {
  for (const guests of [1, 2, 10, 25, 100]) for (const budget of [80, 100, 120, 200, 1000]) for (const occasion of Object.keys(OCCASIONS)) {
    const plan = proposeMenu('batumi', { guests, budget, occasion });
    assert.ok(plan.total <= budget * guests);
    assert.ok(plan.total >= budget * guests - 5);
    assert.equal(draftTotal(plan.lines), plan.total);
    assert.equal(plan.perPerson, Math.round(plan.total / guests * 100) / 100);
    for (const line of plan.lines) {
      assert.equal(line.unitPrice, menuItem(menuFor('batumi'), line.itemId).price);
      assert.ok(Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 1000);
    }
  }
});
test('no invented catalog for other venues; invalid planning inputs rejected', () => {
  assert.equal(proposeMenu('kutaisi', { guests: 10, budget: 100 }), null);
  assert.equal(proposeMenu('tbilisi', { guests: 10, budget: 100 }), null);
  for (const settings of [{ guests: 0, budget: 80 }, { guests: 2.5, budget: 80 }, { guests: 10, budget: 79 }, { guests: 101, budget: 120 }, { guests: 10, budget: 120, occasion: 'unknown' }]) assert.throws(() => proposeMenu('batumi', settings));
});
test('server price catalog exactly matches browser catalog', () => {
  assert.deepEqual(JSON.parse(readFileSync(new URL('../../database/catalog/restaurant-menus.json', import.meta.url))), RESTAURANT_MENUS);
});
