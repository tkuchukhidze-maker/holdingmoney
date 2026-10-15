// Room types transcribed from the approved Magnolia design. This is a type
// catalog, not live inventory. Prices/availability are deliberately absent.
export const HOTEL_ROOMS = {
  magnolia: { name: 'Hotel Magnolia', city: 'თბილისი', rooms: [
    { id: 'single', name: 'Standard Single', capacity: 1, beds: ['single'], bedLabel: 'ერთი ერთადგილიანი საწოლი' },
    { id: 'double', name: 'Standard Double', capacity: 2, beds: ['double'], bedLabel: 'ერთი ორადგილიანი საწოლი' },
    { id: 'twin', name: 'Standard Twin', capacity: 2, beds: ['twin'], bedLabel: 'ორი ცალკე საწოლი' },
    { id: 'triple', name: 'Standard Triple', capacity: 3, beds: ['double', 'single'], bedLabel: 'King და ერთადგილიანი საწოლი' },
    { id: 'deluxe', name: 'Deluxe Double', capacity: 2, beds: ['double'], bedLabel: 'King საწოლი', view: 'ქალაქის ხედი' },
  ] },
  'chateau-mere': { name: 'შატო მერე', city: 'თელავი', rooms: [] },
};
export const BED_PREFERENCES = { any: 'არ აქვს მნიშვნელობა', double: 'ორადგილიანი საწოლი', twin: 'ცალკე საწოლები' };
export const STAY_PURPOSES = { leisure: 'დასვენება', business: 'საქმიანი ვიზიტი', family: 'ოჯახთან ერთად', romantic: 'ორისთვის' };
export function hotelFor(slug) { return Object.hasOwn(HOTEL_ROOMS, slug) ? HOTEL_ROOMS[slug] : null; }
export function stayNights(checkIn, checkOut) {
  const valid = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  if (!valid(checkIn) || !valid(checkOut)) return 0;
  const nights = (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000;
  return Number.isInteger(nights) && nights > 0 && nights <= 365 ? nights : 0;
}
export function recommendRooms(slug, preferences) {
  const { adults, children, roomCount } = preferences;
  const total = Number(adults) + Number(children);
  const countsValid = Number.isInteger(Number(adults)) && adults >= 1 && adults <= 10 && Number.isInteger(Number(children)) && children >= 0 && total <= 10 && Number.isInteger(Number(roomCount)) && roomCount >= 1 && roomCount <= 5;
  if (!countsValid || !Object.hasOwn(BED_PREFERENCES, preferences.bed) || !Object.hasOwn(STAY_PURPOSES, preferences.purpose)) throw new Error('გადაამოწმეთ სტუმრებისა და ნომრების რაოდენობა. მაქსიმუმ 10 სტუმარი და 5 ნომერი.');
  const hotel = hotelFor(slug);
  if (!hotel) throw new Error('სასტუმრო ვერ მოიძებნა.');
  const perRoom = Math.ceil(total / roomCount);
  const compatible = hotel.rooms.filter(r => preferences.bed === 'any' || r.beds.includes(preferences.bed));
  const maxCapacity = Math.max(0, ...compatible.map(r => r.capacity));
  const options = compatible.filter(r => r.capacity >= perRoom).map(r => ({ ...r, roomCount: Number(roomCount), totalCapacity: r.capacity * roomCount,
    reason: `${roomCount} ნომერი იტევს ${r.capacity * roomCount} სტუმარს; თქვენი ჯგუფი — ${total}.`,
    score: (r.capacity - perRoom) * 10 + (r.id === 'deluxe' ? 2 : 0) + (preferences.purpose === 'family' && r.id === 'triple' ? -1 : 0) })).sort((a, b) => a.score - b.score);
  return { options, totalGuests: total, perRoom, missingCatalog: hotel.rooms.length === 0, suggestedRooms: maxCapacity ? Math.ceil(total / maxCapacity) : null };
}
