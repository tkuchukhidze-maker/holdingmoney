import { menuFor, menuItem } from './menu-data.js';
import { draftLines, draftTotal } from './menu-cart.js';

export const OCCASIONS = { traditional: 'ქართული სუფრა', birthday: 'დაბადების დღე', business: 'საქმიანი შეხვედრა' };
export const MAX_GUESTS = 100;
// Relative spending weights, not claims about verified serving sizes.
const RECIPES = {
  traditional: [['appetizers-1', 9], ['appetizers-5', 7], ['cold-3', 8], ['main-11', 16], ['grill-1', 20], ['bakery-1', 12], ['bakery-9', 3], ['desserts-1', 12], ['soft-drinks-1', 6]],
  birthday: [['appetizers-2', 8], ['appetizers-1', 8], ['cold-4', 10], ['main-4', 16], ['grill-3', 18], ['bakery-2', 12], ['bakery-9', 3], ['desserts-2', 15], ['soft-drinks-1', 6]],
  business: [['appetizers-3', 7], ['cold-1', 10], ['main-6', 24], ['grill-3', 17], ['bakery-2', 9], ['bakery-9', 3], ['desserts-1', 15], ['soft-drinks-1', 6]],
};
export function proposeMenu(slug, { guests, budget, occasion = 'traditional' }) {
  guests = Number(guests); budget = Number(budget);
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) throw new Error('სტუმრების რაოდენობა უნდა იყოს 1–100.');
  if (!Number.isFinite(budget) || budget < 80 || budget > 1000) throw new Error('ბიუჯეტი უნდა იყოს 80–1000 ₾ ერთ ადამიანზე.');
  if (!Object.hasOwn(OCCASIONS, occasion)) throw new Error('აირჩიეთ სუფრის ტიპი.');
  const menu = menuFor(slug);
  if (!menu?.sections.length || slug !== 'batumi') return null;
  const items = RECIPES[occasion].map(([id, weight]) => ({ ...menuItem(menu, id), weight }));
  const target = Math.floor(budget * guests * 100);
  const weightTotal = items.reduce((n, i) => n + i.weight, 0);
  const quantities = {};
  let spent = 0;
  for (const item of items) {
    const cents = Math.round(item.price * 100);
    const count = Math.min(1000, Math.floor(target * item.weight / weightTotal / cents));
    if (count) quantities[item.id] = count;
    spent += count * cents;
  }
  // Add the most underrepresented affordable dish, preserving the selected
  // occasion's balance. Never inflate a price to hit an advertised budget.
  while (true) {
    const candidates = items.filter(i => spent + Math.round(i.price * 100) <= target && (quantities[i.id] || 0) < 1000);
    if (!candidates.length) break;
    candidates.sort((a, b) => (target * b.weight / weightTotal - (quantities[b.id] || 0) * b.price * 100) - (target * a.weight / weightTotal - (quantities[a.id] || 0) * a.price * 100));
    const item = candidates[0]; quantities[item.id] = (quantities[item.id] || 0) + 1; spent += Math.round(item.price * 100);
  }
  const lines = draftLines(slug, quantities);
  const total = draftTotal(lines);
  return { quantities, lines, total, perPerson: Math.round(total / guests * 100) / 100, guests, budget, occasion };
}
