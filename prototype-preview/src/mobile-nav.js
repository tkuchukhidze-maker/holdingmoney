import { screenFromPath, screenPath } from './screen-routes.js';

/** Mobile navigation inspired by hospitality discovery UX:
 * big touch targets, obvious categories, no copy of Airbnb branding/assets.
 */
export const MOBILE_TABS = Object.freeze([
  { text: 'მთავარი', icon: 'home', href: '/' },
  { text: 'რესტორნები', icon: 'restaurant', href: '/restaurants' },
  { text: 'სასტუმროები', icon: 'hotel', href: '/hotels' },
  { text: 'My Episode', icon: 'account', href: '/my-episode' },
]);

const ICON_PATHS = {
  home: ['M3 10 12 3l9 7', 'M5 9v12h5v-7h4v7h5V9'],
  restaurant: ['M4 3v5a3 3 0 0 0 6 0V3', 'M7 3v18', 'M20 21V3c-4 2-5 7-5 10h5'],
  hotel: ['M3 21V4h18v17', 'M9 21v-6h6v6', 'M7 8h2m6 0h2M7 11h2m6 0h2'],
  account: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M4 21v-2a8 8 0 0 1 16 0v2'],
};

export function mobileCurrentTab(pathname) {
  const cleaned = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const screen = screenFromPath(cleaned);
  const path = screen ? screenPath(screen) : cleaned;
  if (path === '/restaurants' || path.startsWith('/restaurants/')) return '/restaurants';
  if (path === '/hotels' || path.startsWith('/hotels/')) return '/hotels';
  if (path === '/my-episode' || path === '/register') return '/my-episode';
  return path === '/' ? '/' : null;
}

export function mountMobileNavigation(doc = document, pathname = doc.location?.pathname || '/') {
  const host = doc.body;
  if (!host || host.querySelector('#episode-mobile-navigation')) return;
  const nav = doc.createElement('nav');
  nav.id = 'episode-mobile-navigation';
  nav.className = 'episode-mobile-nav';
  nav.setAttribute('aria-label', 'მობილური მთავარი ნავიგაცია');
  const active = mobileCurrentTab(pathname);
  for (const tab of MOBILE_TABS) {
    const link = doc.createElement('a');
    link.href = tab.href;
    if (active === tab.href) link.setAttribute('aria-current', 'page');
    const icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'episode-mobile-icon');
    for (const [name, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', focusable: 'false' })) icon.setAttribute(name, value);
    icon.setAttribute('aria-hidden', 'true');
    for (const d of ICON_PATHS[tab.icon]) {
      const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      icon.appendChild(path);
    }
    const label = doc.createElement('span');
    label.className = 'episode-mobile-label';
    label.textContent = tab.text;
    link.append(icon, label);
    nav.appendChild(link);
  }
  host.appendChild(nav);
}
