import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

// Only confirmed venue names and cities. No invented opening hours, prices,
// addresses, menu items or booking availability.
export const VENUE_COLLECTIONS = Object.freeze({
  restaurants: {
    label: 'რესტორნები',
    eyebrow: 'EPISODE RESTAURANTS',
    heading: 'აირჩიეთ რესტორანი',
    summary: 'აღმოაჩინეთ Episode Holding-ის რესტორნები. აირჩიეთ სასურველი ქალაქი და გადადით რესტორნის გვერდზე.',
    action: 'რესტორნის ნახვა',
    venues: [
      { slug: 'batumi', photo: '/photos/batumi.webp', name: 'ბათუმის სახლში', latin: 'Batumis Sakhlshi', city: 'ბათუმი', href: '/restaurants/batumi', theme: 'batumi', logo: '/brand/batumis-sakhlshi.png' },
      { slug: 'kutaisi', photo: '/photos/kutaisi.webp', name: 'ქუთაისის სახლში', latin: 'Kutaisis Sakhlshi', city: 'ქუთაისი', href: '/restaurants/kutaisi', theme: 'kutaisi', logo: '/brand/kutaisis-sakhlshi.png' },
      { slug: 'tbilisi', photo: '/photos/holding-interiors.webp', name: 'თბილისის სახლში', latin: 'Tbilisis Sakhlshi', city: 'თბილისი', href: '/restaurants/tbilisi', theme: 'tbilisi', logo: null },
    ],
  },
  hotels: {
    label: 'სასტუმროები',
    eyebrow: 'EPISODE HOTELS',
    heading: 'აირჩიეთ სასტუმრო',
    summary: 'აღმოაჩინეთ Episode Holding-ის სასტუმროები და გახსენით სასურველი ობიექტის გვერდი.',
    action: 'სასტუმროს ნახვა',
    venues: [
      { slug: 'magnolia', photo: '/photos/magnolia.webp', name: 'სასტუმრო მაგნოლია', latin: 'Hotel Magnolia', city: 'თბილისი', href: '/hotels/magnolia', theme: 'magnolia', logo: null },
      { slug: 'chateau-mere', photo: '/photos/editorial.webp', name: 'შატო მერე', latin: 'Chateau Mere', city: 'თელავი', href: '/hotels/chateau-mere', theme: 'chateau', logo: null },
    ],
  },
});

export function VenueCollection({ kind }) {
  const collection = VENUE_COLLECTIONS[kind];
  const [city, setCity] = useState('ყველა');
  if (!collection) return null;
  const cities = ['ყველა', ...new Set(collection.venues.map((venue) => venue.city))];
  const visible = collection.venues.filter((venue) => city === 'ყველა' || venue.city === city);

  return React.createElement('div', { className: 'ec-page', lang: 'ka' },
    React.createElement('header', { className: 'ec-header' },
      React.createElement('a', { href: '/', className: 'ec-wordmark', 'aria-label': 'Episode Holding — მთავარი' },
        React.createElement('strong', null, 'EPISODE'),
        React.createElement('small', null, 'HOLDING'),
      ),
      React.createElement('nav', { className: 'ec-nav', 'aria-label': 'მთავარი მენიუ' },
        React.createElement('a', { href: '/' }, 'მთავარი'),
        React.createElement('a', { href: '/restaurants', 'aria-current': kind === 'restaurants' ? 'page' : undefined }, 'რესტორნები'),
        React.createElement('a', { href: '/hotels', 'aria-current': kind === 'hotels' ? 'page' : undefined }, 'სასტუმროები'),
      ),
    ),
    React.createElement('main', { id: 'main', className: 'ec-container' },
      React.createElement('nav', { className: 'ec-breadcrumb', 'aria-label': 'მდებარეობა' },
        React.createElement('a', { href: '/' }, 'მთავარი'),
        React.createElement('span', { 'aria-hidden': 'true' }, '/'),
        React.createElement('span', { 'aria-current': 'page' }, collection.label),
      ),
      React.createElement('section', { className: 'ec-intro' },
        React.createElement('div', { className: 'ec-overline' }, collection.eyebrow),
        React.createElement('h1', null, collection.heading),
        React.createElement('p', null, collection.summary),
      ),
      React.createElement('div', { className: 'ec-filters', role: 'group', 'aria-label': 'ქალაქის მიხედვით არჩევა' },
        ...cities.map((entry) =>
          React.createElement('button', {
            key: entry,
            type: 'button',
            className: 'ec-filter',
            'aria-pressed': entry === city,
            onClick: () => setCity(entry),
          }, entry),
        ),
      ),
      kind === 'restaurants' ? React.createElement('section', { className: 'ec-offer-highlight', 'aria-label': 'დღის შეთავაზების პროექტი' },
        React.createElement('img', { src: '/photos/holding-interiors.webp', alt: 'საილუსტრაციო ფოტო — ქართული რესტორნის გარემო', loading: 'lazy' }),
        React.createElement('div', { className: 'ec-offer-copy' },
          React.createElement('span', { className: 'ec-offer-status' }, 'შეთავაზების პროექტი — ჯერ არ მოქმედებს'),
          React.createElement('h2', null, 'ხინკლის შუადღე'),
          React.createElement('p', null, '12:00–17:00 · 5 ხინკალზე 1 ლუდი საჩუქრად'),
          React.createElement('small', null, 'ფილიალები, მოქმედების თარიღები და პირობები დასადასტურებელია. ალკოჰოლი მხოლოდ სრულწლოვნებისთვის.'),
          React.createElement('a', { href: '/restaurants/batumi/menu#daily-offer' }, 'მენიუსა და კამპანიის ნახვა →'),
        ),
      ) : null,
      React.createElement('section', { className: 'ec-grid', 'aria-label': collection.label },
        ...visible.map((venue) =>
          React.createElement('a', {
            key: venue.slug,
            className: 'ec-card ec-' + venue.theme,
            href: venue.href,
            'aria-label': venue.name + ' — ' + collection.action,
          },
            React.createElement('div', { className: 'ec-art' },
              React.createElement('img', { className: 'ec-cover', src: venue.photo, alt: 'საილუსტრაციო ფოტო — ' + venue.city, loading: 'lazy', decoding: 'async' }),
              React.createElement('span', { className: 'ec-city-pill' }, venue.city),
              React.createElement('span', { className: 'ec-photo-caption' }, 'საილუსტრაციო ფოტო'),
              venue.logo
                ? React.createElement('img', { className: 'ec-brand-logo', src: venue.logo, alt: venue.name + ' — ლოგო', loading: 'lazy' })
                : React.createElement('div', { className: 'ec-brand-initial', 'aria-hidden': 'true' }, venue.latin),
            ),
            React.createElement('div', { className: 'ec-card-body' },
              React.createElement('span', { className: 'ec-card-kind' }, kind === 'restaurants' ? 'EPISODE RESTAURANT' : 'EPISODE HOTEL'),
              React.createElement('h2', null, venue.name),
              React.createElement('p', null, venue.city),
              React.createElement('span', { className: 'ec-card-link' }, collection.action, React.createElement('span', { 'aria-hidden': 'true' }, ' →')),
            ),
          ),
        ),
      ),
      React.createElement('div', { className: 'ec-other' },
        React.createElement('span', null, kind === 'restaurants' ? 'გსურთ დასვენება?' : 'გსურთ რესტორანში სტუმრობა?'),
        React.createElement('a', { href: kind === 'restaurants' ? '/hotels' : '/restaurants' }, kind === 'restaurants' ? 'იხილეთ სასტუმროები →' : 'იხილეთ რესტორნები →'),
      ),
    ),
    React.createElement('footer', { className: 'ec-footer' },
      React.createElement('span', null, '© Episode Holding'),
      React.createElement('a', { href: '/' }, 'მთავარ გვერდზე დაბრუნება'),
    ),
  );
}

export function mountCollection(kind) {
  const collection = VENUE_COLLECTIONS[kind];
  if (!collection) throw new Error('Unknown collection: ' + kind);
  document.title = collection.heading + ' · Episode Holding';
  createRoot(document.getElementById('root')).render(React.createElement(VenueCollection, { kind }));
}
