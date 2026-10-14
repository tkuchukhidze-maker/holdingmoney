/**
 * dc-runtime.js — browser side of the standalone prototype viewer.
 * Loads design/project/<Screen>.dc.html, compiles it with dc-parse.js and mounts it.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { compileScreen, h } from './dc-parse.js';
import { isKnownScreen, screenPath } from './screen-routes.js';

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
        'Render error: ' + String(this.state.error && this.state.error.stack || this.state.error));
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

export async function mountScreen(screen) {
  const rootEl = document.getElementById('root');
  try {
    const res = await fetch(BASE + screen + '.dc.html');
    if (!res.ok) throw new Error('Screen "' + screen + '" not found (' + res.status + ')');
    const src = await res.text();
    const scr = compileScreen(src, { rewriteHref });
    document.title = scr.title || screen;
    injectHead(scr.links, scr.styles, screen);
    createRoot(rootEl).render(h(ErrorBoundary, null, h(scr.Component, screen === 'Main' ? { ...scr.defaultProps, signedIn: false } : scr.defaultProps)));
  } catch (e) {
    rootEl.innerHTML = '';
    const pre = document.createElement('pre');
    pre.style.cssText = 'padding:24px;color:#7A1F1F;white-space:pre-wrap;font:13px/1.5 ui-monospace,monospace';
    pre.textContent = String(e && e.stack || e);
    rootEl.appendChild(pre);
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
  rootEl.appendChild(wrap);
}
