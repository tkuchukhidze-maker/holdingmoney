import { mountScreen, renderIndex } from './dc-runtime.js';
import { isKnownScreen, screenFromPath } from './screen-routes.js';

const currentUrl = new URL(window.location.href);
const explicitScreen = currentUrl.searchParams.get('screen');
const pathScreen = screenFromPath(currentUrl.pathname);

// Direct links and refreshes now resolve to the approved page.
// /screens remains an explicit index for comparing all nine designs.
if (currentUrl.pathname === '/screens') {
  renderIndex();
} else {
  const screen = explicitScreen || pathScreen || 'Main';
  if (isKnownScreen(screen)) {
    mountScreen(screen);
  } else {
    const root = document.getElementById('root');
    root.textContent = 'Requested preview screen not found.';
  }
}
