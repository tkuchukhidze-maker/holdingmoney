/**
 * Get only the authenticated customer's profile from the same-origin backend.
 * No user-supplied ID, localStorage or demo identity: guest / 401 => null.
 */
const ENDPOINT = '/api/customer/profile';

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function normalizedCustomerProfile(raw) {
  if (!raw || raw.authenticated !== true || typeof raw !== 'object') return null;
  const firstName = clean(raw.firstName, 120);
  const lastName = clean(raw.lastName, 120);
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  if (!fullName) return null;
  const phone = clean(raw.phone, 32);
  const email = clean(raw.email, 254);
  return { firstName, lastName, fullName, phone, email };
}

export async function fetchCustomerProfile(fetchFn = fetch, { signal } = {}) {
  try {
    const response = await fetchFn(ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      signal,
    });
    if (response.status === 401 || response.status === 403 || response.status === 404 || !response.ok) return null;
    return normalizedCustomerProfile(await response.json());
  } catch (error) {
    if (error?.name === 'AbortError') return null;
    return null;
  }
}

export function contactFromProfile(profile, current = {}) {
  if (!profile) return { ...current };
  const take = (key) => {
    const typed = clean(current[key], key === 'email' ? 254 : 240);
    return typed || profile[key] || '';
  };
  return {
    ...current,
    fullName: take('fullName'),
    phone: take('phone'),
    email: take('email'),
  };
}

/**
 * This helper only fills empty, uncontrolled contact fields in an approved
 * restaurant / hotel prototype. React-owned inputs, unrelated registration
 * forms and anything the customer has already typed are never overwritten.
 */
export function prefillBookingDom(root, profile) {
  if (!root || !profile) return 0;
  const section = root.querySelector('#booking');
  if (!section) return 0;
  let updated = 0;
  const fields = [
    ['name', profile.fullName],
    ['tel', profile.phone],
    ['email', profile.email],
  ];
  for (const [autocomplete, value] of fields) {
    if (!value) continue;
    const input = section.querySelector('input[autocomplete="' + autocomplete + '"]');
    if (!input || input.disabled || input.readOnly || input.value.trim()) continue;
    input.value = value;
    updated++;
  }
  return updated;
}
