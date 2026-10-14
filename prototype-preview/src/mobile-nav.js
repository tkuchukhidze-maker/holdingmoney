/** Mobile navigation inspired by hospitality discovery UX:
 * big touch targets, obvious categories, no copy of Airbnb branding/assets.
 */
export const MOBILE_TABS = Object.freeze([
  { text: 'მთავარი', icon: '⌂', href: '/' },
  { text: 'რესტორნები', icon: '♨', href: '/restaurants' },
  { text: 'სასტუმროები', icon: '▤', href: '/hotels' },
  { text: 'My Episode', icon: '○', href: '/my-episode' },
]);

export function mobileCurrentTab(pathname) {
  if (pathname.startsWith('/restaurants')) return '/restaurants';
  if (pathname.startsWith('/hotels')) return '/hotels';
  if (pathname.startsWith('/my-episode') || pathname.startsWith('/register')) return '/my-episode';
  return '/';
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
    const icon = doc.createElement('span');
    icon.className = 'episode-mobile-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = tab.icon;
    const label = doc.createElement('span');
    label.className = 'episode-mobile-label';
    label.textContent = tab.text;
    link.append(icon, label);
    nav.appendChild(link);
  }
  host.appendChild(nav);
}
