// Stable public preview routes. They map to approved, unchanged design files.
// These screens demonstrate interactions only; no real reservations or auth.
export const SCREEN_PATHS = Object.freeze({
  Main: '/',
  Batumi: '/restaurants/batumi',
  Kutaisi: '/restaurants/kutaisi',
  Tbilisi: '/restaurants/tbilisi',
  Magnolia: '/hotels/magnolia',
  ChateauMere: '/hotels/chateau-mere',
  Register: '/register',
  MyEpisode: '/my-episode',
  Admin: '/admin',
});

const aliases = Object.freeze({
  '/places/batumi': 'Batumi',
  '/places/kutaisi': 'Kutaisi',
  '/places/tbilisi': 'Tbilisi',
  '/places/magnolia': 'Magnolia',
  '/places/chateau-mere': 'ChateauMere',
  '/auth': 'Register',
  '/account': 'MyEpisode',
  '/dashboard': 'Admin',
});

export const screenNames = Object.keys(SCREEN_PATHS);

export function screenFromPath(pathname) {
  const cleaned = (pathname.replace(/\/+$/, '') || '/').toLowerCase();
  for (const [screen, path] of Object.entries(SCREEN_PATHS)) {
    if (path === cleaned) return screen;
  }
  return aliases[cleaned] || null;
}

export function screenPath(screen) {
  return SCREEN_PATHS[screen] || '/';
}

export function isKnownScreen(screen) {
  return Object.prototype.hasOwnProperty.call(SCREEN_PATHS, screen);
}
