import { mountScreen, renderIndex } from './dc-runtime.js';
import { isKnownScreen, screenFromPath } from './screen-routes.js';

const currentUrl = new URL(window.location.href);
const screen = currentUrl.searchParams.get('screen') || screenFromPath(currentUrl.pathname);

if (currentUrl.pathname === '/screens') {
  // Internal design inventory — never the public homepage.
  renderIndex();
} else if (screen && isKnownScreen(screen)) {
  const notice = document.createElement('div');
  notice.className = 'episode-status';
  notice.setAttribute('role', 'status');
  notice.setAttribute('lang', 'ka');
  notice.textContent = 'საინფორმაციო ვერსია — ონლაინ ჯავშნები, რეგისტრაცია და ლოიალობის ქულები ჯერ არ არის გააქტიურებული.';
  document.body.prepend(notice);
  mountScreen(screen);
} else {
  document.getElementById('root').textContent = 'გვერდი ვერ მოიძებნა.';
}
