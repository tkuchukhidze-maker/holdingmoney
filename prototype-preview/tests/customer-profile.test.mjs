import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizedCustomerProfile, fetchCustomerProfile, contactFromProfile, prefillBookingDom } from '../src/customer-profile.js';
import { makeRequestText } from '../src/menu-cart.js';

const profile = { authenticated: true, firstName: 'ნინო', lastName: 'კაპანაძე', email: 'nino@example.test', phone: '+995599112233' };

test('autofill only accepts authenticated, complete profile data', () => {
  assert.equal(normalizedCustomerProfile({ ...profile, authenticated: false }), null);
  assert.equal(normalizedCustomerProfile({ authenticated: true, firstName: '', lastName: '' }), null);
  assert.deepEqual(normalizedCustomerProfile(profile), {
    firstName: 'ნინო', lastName: 'კაპანაძე', fullName: 'ნინო კაპანაძე', email: 'nino@example.test', phone: '+995599112233',
  });
});

test('guest has no profile, fetch uses same-origin session and no caching', async () => {
  let called;
  const request = async (url, options) => {
    called = { url, options };
    return { ok: false, status: 401 };
  };
  assert.equal(await fetchCustomerProfile(request), null);
  assert.equal(called.url, '/api/customer/profile');
  assert.equal(called.options.credentials, 'same-origin');
  assert.equal(called.options.cache, 'no-store');
  assert.equal(called.options.headers.Accept, 'application/json');
  assert.equal(await fetchCustomerProfile(async () => ({ ok: false, status: 404 })), null);
  assert.equal(await fetchCustomerProfile(async () => { throw new Error('offline'); }), null);
});

test('authenticated profile prefills blank fields but never overwrites customer input', () => {
  const result = contactFromProfile(normalizedCustomerProfile(profile), { fullName: 'სხვა სტუმარი', email: '', phone: '' });
  assert.equal(result.fullName, 'სხვა სტუმარი');
  assert.equal(result.email, 'nino@example.test');
  assert.equal(result.phone, '+995599112233');
  assert.deepEqual(contactFromProfile(null, { phone: 'custom' }), { phone: 'custom' });
});

test('DOM autofill only touches empty booking fields and avoids other forms', () => {
  const makeField = (value = '') => ({ value, disabled: false, readOnly: false });
  const name = makeField(), phone = makeField('+995555000000'), email = makeField();
  const inputs = { name, tel: phone, email };
  const section = { querySelector: selector => {
    const m = selector.match(/autocomplete="([^"]+)"/);
    return inputs[m?.[1]] || null;
  } };
  const root = { querySelector: selector => selector === '#booking' ? section : null };
  const currentProfile = normalizedCustomerProfile(profile);
  assert.equal(prefillBookingDom(root, currentProfile), 2);
  assert.equal(name.value, 'ნინო კაპანაძე');
  assert.equal(phone.value, '+995555000000');
  assert.equal(email.value, 'nino@example.test');
  assert.equal(prefillBookingDom(root, currentProfile), 0);
  assert.equal(prefillBookingDom(root, null), 0);
});

test('menu sharing includes signed-in details without persisting them in cart storage', () => {
  const text = makeRequestText('batumi', { 'khinkali-1': 3 }, {
    fullName: 'ნინო კაპანაძე', phone: '+995599112233',
    email: 'nino@example.test', date: '2026-10-20', time: '19:30', guests: 2,
  });
  assert.ok(text.includes('სტუმარი: ნინო კაპანაძე'));
  assert.ok(text.includes('საკონტაქტო ტელეფონი: +995599112233'));
  assert.ok(text.includes('ელფოსტა: nino@example.test'));
});
