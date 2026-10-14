import { offerForVenue } from './daily-offers.js';

// This website adapts the public presentation at runtime: it does not alter
// any approved *.dc.html design file. An offer is owned by ONE venue and
// appears only on that venue's page, never in the holding restaurant directory.
const RESTAURANTS = Object.freeze({
  Batumi: { slug: 'batumi', photo: '/photos/batumi.webp', name: 'ბათუმის სახლში' },
  Kutaisi: { slug: 'kutaisi', photo: '/photos/kutaisi.webp', name: 'ქუთაისის სახლში' },
  Tbilisi: { slug: 'tbilisi', photo: '/photos/holding-interiors.webp', name: 'თბილისის სახლში' },
});

export function injectVenueOffer(screen, source) {
  const venue = RESTAURANTS[screen];
  if (!venue) return source;
  const offer = offerForVenue(venue.slug);
  if (!offer) return source;

  const anchor = '<!-- MENU -->';
  if (!source.includes(anchor)) throw new Error('Venue menu section missing for ' + screen);
  const label = offer.status === 'published'
    ? 'დღის შეთავაზება'
    : 'შეთავაზების პროექტი — ჯერ არ მოქმედებს';

  // Only trusted constant text from the authored daily-offers module is
  // interpolated here. No user input, backend data, or rich HTML content.
  const block = `
<!-- Venue-specific daily offer (website only; approved prototype intact) -->
<section id="daily-offer" class="ec-venue-offer" aria-label="დღის შეთავაზება">
  <div class="ec-venue-offer-photo">
    <img src="${venue.photo}" alt="საილუსტრაციო ფოტო — ${venue.name}" loading="lazy" decoding="async">
  </div>
  <div class="ec-venue-offer-content">
    <span class="ec-venue-offer-eyebrow">${label}</span>
    <h2>${offer.title}</h2>
    <p>${offer.startTime}–${offer.endTime} · ${offer.subtitle}</p>
    <small>${offer.disclaimer} ალკოჰოლური სასმელი მხოლოდ სრულწლოვნებისთვის.</small>
    <a href="/restaurants/${venue.slug}/menu#daily-offer">იხილეთ ამ რესტორნის მენიუ <span aria-hidden="true">→</span></a>
  </div>
</section>
`;
  return source.replace(anchor, block + '\n' + anchor);
}
