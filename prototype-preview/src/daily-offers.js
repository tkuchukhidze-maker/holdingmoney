/**
 * Marketing proposal, NOT an active promotion. No dates, inventory, provider
 * approvals or legal eligibility have been confirmed yet. Campaigns are scoped
 * per venue and must be enabled through an audited staff workflow later.
 */
const example = (slug) => Object.freeze({
  id: 'khinkali-beer-lunch-' + slug,
  venueSlug: slug,
  status: 'draft',
  startTime: '12:00',
  endTime: '17:00',
  rewardThreshold: 5,
  rewardQuantity: 1,
  qualifyingCategory: 'khinkali',
  gift: 'ლუდი',
  minGuestAge: 18,
  title: 'ხინკლის შუადღე',
  subtitle: '5 ხინკალზე — 1 ლუდი საჩუქრად',
  disclaimer: 'კამპანიის პროექტია. მოქმედების თარიღები, მონაწილე ფილიალები, ლუდის მოცულობა, ხინკლის სახეობები და სხვა პირობები დამტკიცებული არ არის.',
});

export const DAILY_OFFERS = Object.freeze({
  batumi: example('batumi'),
  kutaisi: example('kutaisi'),
  tbilisi: example('tbilisi'),
});

export function offerForVenue(slug) {
  return Object.prototype.hasOwnProperty.call(DAILY_OFFERS, slug) ? DAILY_OFFERS[slug] : null;
}

export function giftPreview(khinkaliQuantity, offer) {
  if (!offer || !Number.isInteger(khinkaliQuantity) || khinkaliQuantity < 0) return 0;
  return Math.floor(khinkaliQuantity / offer.rewardThreshold) * offer.rewardQuantity;
}

export function isOfferLive(offer, when, approvedVenueSlug) {
  // Explicitly fail closed until the partner has approved and published the
  // offer. A clock falling within 12:00–17:00 alone cannot activate it.
  if (!offer || offer.status !== 'published' || offer.venueSlug !== approvedVenueSlug) return false;
  if (!offer.startDate || !offer.endDate || !(when instanceof Date) || Number.isNaN(when.getTime())) return false;
  const localDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tbilisi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(when);
  const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tbilisi', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(when);
  return localDate >= offer.startDate && localDate <= offer.endDate && hhmm >= offer.startTime && hhmm < offer.endTime;
}
