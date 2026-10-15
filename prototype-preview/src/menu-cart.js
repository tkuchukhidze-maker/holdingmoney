import { menuFor, menuItem } from './menu-data.js';

const VERSION = 1;
export const MAX_QUANTITY = 1000;
const MAX_DIFFERENT_ITEMS = 80;

export function draftStorageKey(slug) {
  return 'episode:menu-draft:v1:' + slug;
}

export function sanitizeDraft(slug, raw) {
  const menu = menuFor(slug);
  if (!menu) return {};
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const safe = {};
  for (const [id, count] of Object.entries(source).slice(0, 400)) {
    if (Object.keys(safe).length >= MAX_DIFFERENT_ITEMS) break;
    const qty = Number(count);
    if (!menuItem(menu, id) || !Number.isInteger(qty) || qty <= 0) continue;
    safe[id] = Math.min(qty, MAX_QUANTITY);
  }
  return safe;
}

export function readDraft(slug, storage) {
  try {
    const target = storage || (typeof window !== 'undefined' ? window.sessionStorage : null);
    if (!target) return {};
    const obj = JSON.parse(target.getItem(draftStorageKey(slug)) || '{}');
    return sanitizeDraft(slug, obj?.version === VERSION ? obj.items : {});
  } catch {
    return {};
  }
}

export function saveDraft(slug, quantities, storage) {
  const items = sanitizeDraft(slug, quantities);
  try {
    const target = storage || (typeof window !== 'undefined' ? window.sessionStorage : null);
    if (target) {
      target.setItem(draftStorageKey(slug), JSON.stringify({ version: VERSION, items }));
    }
  } catch {
    // Keep the current cart usable even when accessing sessionStorage throws.
    // Never persist names, phone numbers or email addresses here.
  }
  return items;
}

export function draftLines(slug, quantities) {
  const menu = menuFor(slug);
  if (!menu) return [];
  const safe = sanitizeDraft(slug, quantities);
  const lines = [];
  for (const section of menu.sections) {
    for (const item of section.items) {
      const qty = safe[item.id] || 0;
      if (qty) lines.push({
        itemId: item.id, name: item.name, quantity: qty,
        unitPrice: item.price, lineTotal: Math.round(item.price * qty * 100) / 100,
        section: section.title,
      });
    }
  }
  return lines;
}

export function draftTotal(lines) {
  return Math.round(lines.reduce((total, line) => total + line.lineTotal, 0) * 100) / 100;
}

export function makeRequestText(slug, quantities, details = {}) {
  const menu = menuFor(slug);
  if (!menu) throw new Error('Unknown restaurant');
  const lines = draftLines(slug, quantities);
  if (!lines.length) throw new Error('No dishes selected');
  const f = (v) => String(v || 'არ არის მითითებული').trim().slice(0, 240);
  const money = (n) => Number(n).toFixed(2);
  const parts = [
    'EPISODE HOLDING — ჯავშნისა და წინასწარი მენიუს მოთხოვნის მონახაზი',
    'რესტორანი: ' + menu.name + ' · ' + menu.city,
    'თარიღი: ' + f(details.date),
    'დრო: ' + f(details.time),
    'სტუმრები: ' + f(details.guests),
    'სტუმარი: ' + f(details.fullName),
    'საკონტაქტო ტელეფონი: ' + f(details.phone),
    'ელფოსტა: ' + f(details.email),
    '',
    'შერჩეული კერძები / სასმელები:',
    ...lines.map((line) => line.name + ' × ' + line.quantity + ' — ' + money(line.lineTotal) + ' ₾'),
    '',
    'მენიუს თანხის ჯამი (საორიენტაციო): ' + money(draftTotal(lines)) + ' ₾',
    'შენიშვნა: ' + f(details.notes),
    '',
    'ეს არის სტუმრის მომზადებული მოთხოვნა და არა დადასტურებული ჯავშანი.',
    'ფასი, ხელმისაწვდომობა და მომსახურების პირობები საჭიროებს რესტორნის დადასტურებას.',
  ];
  return parts.join('\n');
}

// Only non-sensitive planning preferences are saved, scoped to one venue.
export function readPlan(slug) {
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(draftStorageKey(slug) + ':plan') || '{}');
    return { guests: Number.isInteger(raw.guests) && raw.guests >= 1 && raw.guests <= 100 ? raw.guests : 2,
      occasion: ['traditional', 'birthday', 'business'].includes(raw.occasion) ? raw.occasion : 'traditional',
      budget: Number.isFinite(raw.budget) && raw.budget >= 80 && raw.budget <= 1000 ? raw.budget : null };
  } catch { return { guests: 2, occasion: 'traditional', budget: null }; }
}
export function savePlan(slug, plan) {
  try { window.sessionStorage.setItem(draftStorageKey(slug) + ':plan', JSON.stringify({ guests: Number(plan.guests), occasion: plan.occasion, budget: Number(plan.budget) })); } catch { /* in-memory planning stays usable */ }
}
