import { renderPageError } from './page-experience.js';
/**
 * dc-runtime.js — browser side of the standalone prototype viewer.
 * Loads design/project/<Screen>.dc.html, compiles it with dc-parse.js and mounts it.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { compileScreen, h } from './dc-parse.js';
import { isKnownScreen, screenPath } from './screen-routes.js';
import { prepareSiteNavigation } from './site-landing-links.js';
import { injectVenueOffer } from './venue-offer-section.js';
import { preventFakeBookingConfirmation, showVenueContext, venueForScreen } from './booking-context.js';
import { fetchCustomerProfile, prefillBookingDom } from './customer-profile.js';

const BASE = '/project/';

/** Rewrite approved screen links without changing source prototypes. */
export function rewriteHref(href) {
  const m = href.match(/^(?:\.\/|\/)?([A-Za-z0-9_-]+)\.dc\.html(#[^?]*)?$/);
  if (!m || !isKnownScreen(m[1])) return href;
  return screenPath(m[1]) + (m[2] || '');
}

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return h('pre', { style: { padding: 24, color: '#7A1F1F', whiteSpace: 'pre-wrap', font: '13px/1.5 ui-monospace, monospace' } },
        'გვერდის ჩვენება ვერ მოხერხდა. გთხოვთ განაახლოთ გვერდი.');
    }
    return this.props.children;
  }
}

function injectHead(links, styles, screen) {
  for (const attrs of links) {
    if (attrs.href && document.head.querySelector('link[href="' + attrs.href.replace(/"/g, '\\"') + '"]')) continue;
    const el = document.createElement('link');
    for (const k of Object.keys(attrs)) el.setAttribute(k, attrs[k]);
    document.head.appendChild(el);
  }
  styles.forEach((css, i) => {
    const el = document.createElement('style');
    el.setAttribute('data-dc-screen', screen + ':' + i);
    el.textContent = css;
    document.head.appendChild(el);
  });
}

async function loadCanvas() {
  const res = await fetch(BASE + 'canvas.json');
  if (!res.ok) throw new Error('canvas.json not found');
  return res.json();
}

/** Authenticated-only autofill. In the Node-only preview the auth endpoint
 * returns 404, so the page remains a guest form. Never synthesize a profile. */
function BookingProfileBridge({ screen, Component, props }) {
  React.useEffect(() => {
    if (!venueForScreen(screen)) return undefined;
    const controller = new AbortController();
    const root = document.getElementById('root');
    let observer;
    fetchCustomerProfile(fetch, { signal: controller.signal }).then((profile) => {
      if (!profile || controller.signal.aborted || !root) return;
      const fill = () => {
        prefillBookingDom(root, profile);
        const booking = root.querySelector('#booking');
        if (!booking || booking.querySelector('.ecm-profile-loaded')) return;
        const note = document.createElement('div');
        note.className = 'ecm-profile-loaded';
        note.setAttribute('role', 'status');
        note.textContent = 'Episode პროფილიდან შევსებულია: ' + profile.fullName +
          '. თქვენი მონაცემები შეგიძლიათ შეცვალოთ.';
        booking.prepend(note);
      };
      fill();
      observer = new MutationObserver(fill);
      observer.observe(root, { childList: true, subtree: true });
    });
    return () => { controller.abort(); observer?.disconnect(); };
  }, [screen]);
  return h(Component, props);
}

export async function mountScreen(screen) {
  const rootEl = document.getElementById('root');
  try {
    const res = await fetch(BASE + screen + '.dc.html');
    if (!res.ok) throw new Error('Screen "' + screen + '" not found (' + res.status + ')');
    const src = await res.text();
    const content = preventFakeBookingConfirmation(screen, injectVenueOffer(screen, prepareSiteNavigation(screen, src)));
    const scr = compileScreen(content, { rewriteHref });
    document.title = scr.title || screen;
    document.body.dataset.episodeScreen = screen;
    injectHead(scr.links, scr.styles, screen);
    showVenueContext(screen);
    createRoot(rootEl).render(h(ErrorBoundary, null, h(BookingProfileBridge, { screen, Component: scr.Component, props: { ...scr.defaultProps, signedIn: false } })));
  } catch (e) {
    console.error('Screen could not be loaded', e);
    renderPageError(rootEl);
  }
}

export async function renderIndex() {
  const rootEl = document.getElementById('root');
  const canvas = await loadCanvas();
  const wrap = document.createElement('main');
  wrap.className = 'dcv-index';
  const h1 = document.createElement('h1');
  h1.textContent = canvas.title || 'Prototypes';
  const p = document.createElement('p');
  p.textContent = 'Standalone viewer for the approved Claude Design prototypes. These are front-end prototypes with sample data, not the production application.';
  const ul = document.createElement('ul');
  for (const file of canvas.order) {
    const name = file.replace(/\.dc\.html$/, '');
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = screenPath(name);
    a.textContent = (canvas.boards[file] && canvas.boards[file].title) || name;
    const code = document.createElement('code');
    code.textContent = 'design/project/' + file;
    li.append(a, code);
    ul.appendChild(li);
  }
  wrap.append(h1, p, ul);
  rootEl.replaceChildren(wrap);
}
