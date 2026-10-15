import { mountHome } from './home.jsx';
import { mountRestaurantBooking } from './restaurant-booking.jsx';
import { installPageExperience, renderUnavailableAccount, renderPageError } from './page-experience.js';
import { mountScreen, renderIndex } from './dc-runtime.js';
import { isKnownScreen, screenPath, screenFromPath, collectionFromPath, menuFromPath, bookingFromPath } from './screen-routes.js';
import { mountCollection } from './venue-collections.js';
import { mountRestaurantMenu } from './restaurant-menu.jsx';
import { mountMobileNavigation } from './mobile-nav.js';

const currentUrl = new URL(window.location.href);
installPageExperience();
const bookingSlug = bookingFromPath(currentUrl.pathname);
const collection = collectionFromPath(currentUrl.pathname);
const menuSlug = menuFromPath(currentUrl.pathname);
const screen = currentUrl.searchParams.get('screen') || screenFromPath(currentUrl.pathname);

mountMobileNavigation(document, screen && isKnownScreen(screen) ? screenPath(screen) : currentUrl.pathname);

if (['Register', 'MyEpisode', 'Admin'].includes(screen)) {
  renderUnavailableAccount(screen);
} else if (currentUrl.pathname === '/screens') {
  // Internal design inventory — never the public homepage.
  renderIndex();
} else if (bookingSlug) {
  mountRestaurantBooking(bookingSlug);
} else if (menuSlug) {
  mountRestaurantMenu(menuSlug);
} else if (collection) {
  mountCollection(collection);
} else if (screen === 'Main') {
  mountHome();
} else if (screen && isKnownScreen(screen)) {
  const notice = document.createElement('div');
  notice.className = 'episode-status';
  notice.setAttribute('role', 'status');
  notice.setAttribute('lang', 'ka');
  notice.textContent = 'ჯავშნის მოთხოვნა საჭიროებს რესტორნის დადასტურებას. რეგისტრაცია და ლოიალობის ქულები ჯერ არ არის გააქტიურებული.';
  document.body.prepend(notice);
  mountScreen(screen);
} else {
  renderPageError(document.getElementById('root'), 'გვერდი ვერ მოიძებნა.');
}
