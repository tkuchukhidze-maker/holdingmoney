import { draftLines, draftTotal, readDraft } from './menu-cart.js';
// A customer's Episode profile is global; a reservation belongs to one venue.
// Route determines the selected venue. Never infer the booking destination
// from the signed-in customer's profile or the last venue visited.
export const BOOKABLE_VENUES = Object.freeze({
  Batumi: { venueKey: 'restaurant:batumi', kind: 'restaurant', name: 'ბათუმის სახლში', city: 'ბათუმი', route: '/restaurants/batumi', collection: '/restaurants' },
  Kutaisi: { venueKey: 'restaurant:kutaisi', kind: 'restaurant', name: 'ქუთაისის სახლში', city: 'ქუთაისი', route: '/restaurants/kutaisi', collection: '/restaurants' },
  Tbilisi: { venueKey: 'restaurant:tbilisi', kind: 'restaurant', name: 'თბილისის სახლში', city: 'თბილისი', route: '/restaurants/tbilisi', collection: '/restaurants' },
  Magnolia: { venueKey: 'hotel:magnolia', kind: 'hotel', name: 'სასტუმრო მაგნოლია', city: 'თბილისი', route: '/hotels/magnolia', collection: '/hotels' },
  ChateauMere: { venueKey: 'hotel:chateau-mere', kind: 'hotel', name: 'შატო მერე', city: 'თელავი', route: '/hotels/chateau-mere', collection: '/hotels' },
});

export function venueForScreen(screen) {
  return Object.prototype.hasOwnProperty.call(BOOKABLE_VENUES, screen)
    ? BOOKABLE_VENUES[screen] : null;
}

// The existing designs contain fake "confirmed / SMS sent" flows.
// On a website that has no booking API, never allow a demo confirmation.
export function preventFakeBookingConfirmation(screen, original) {
  const venue = venueForScreen(screen);
  if (!venue) return original;
  const pattern = venue.kind === 'restaurant'
    ? /<button type="button" onClick="{{confirm}}" style="([^"]*)">{{confirmLabel}}<\/button>/
    : /<button type="button" onClick="{{confirm}}" disabled="{{cantBook}}" style="([^"]*)">ჯავშნის დადასტურება<\/button>/;
  if (!pattern.test(original)) throw new Error('Confirmation button was not found on ' + screen);
  return original.replace(pattern, (_all, style) =>
    '<button type="button" disabled="disabled" title="ონლაინ ჯავშნები ჯერ არ არის გააქტიურებული" ' +
    'style="' + style + ' opacity: 0.6; cursor: not-allowed;">ჯავშანი მალე გააქტიურდება</button>');
}

export function showVenueContext(screen, documentRoot = document) {
  const venue = venueForScreen(screen);
  if (!venue) return null;
  const el = documentRoot.createElement('div');
  el.className = 'ec-selected-venue';
  el.setAttribute('role', 'status');
  el.setAttribute('lang', 'ka');
  el.dataset.venueKey = venue.venueKey;
  const text = documentRoot.createElement('span');
  text.textContent = 'არჩეული ობიექტი: ' + venue.name + ' · ' + venue.city;
  const link = documentRoot.createElement('a');
  link.href = venue.collection;
  link.textContent = venue.kind === 'restaurant' ? 'სხვა რესტორნის არჩევა →' : 'სხვა სასტუმროს არჩევა →';
  const actions = documentRoot.createElement('span');
  actions.className = 'ecm-venue-actions';
  if (venue.kind === 'restaurant') {
    const slug = screen.toLowerCase();
    const selected = draftLines(slug, readDraft(slug));
    const menu = documentRoot.createElement('a');
    menu.className = 'ecm-menu-link';
    menu.href = venue.route + '/menu';
    menu.textContent = 'სრული მენიუ და კერძების არჩევა ↗';
    actions.append(menu);
    if (selected.length) {
      const pill = documentRoot.createElement('span');
      pill.className = 'ecm-draftpill';
      const count = selected.reduce((total, line) => total + line.quantity, 0);
      pill.textContent = 'შერჩეული მენიუ: ' + count + ' ერთეული · ' +
        draftTotal(selected).toLocaleString('ka-GE') + ' ₾ (მონახაზი)';
      actions.append(pill);
    }
  }
  actions.append(link);
  el.append(text, actions);
  documentRoot.getElementById('root').before(el);
  return el;
}
