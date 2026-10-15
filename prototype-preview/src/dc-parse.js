/**
 * dc-parse.js — open-source, standalone implementation of the subset of the
 * Claude Design "Design Component" (.dc.html) format used by the Episode
 * Holding prototypes. Written for this project; it does NOT contain or depend
 * on Claude's proprietary `support.js` runtime.
 *
 * Supported:
 *   <x-dc> root, <helmet> (fonts / base CSS), {{dotted.path}} holes in text and
 *   attributes (whole-attribute holes keep raw values: functions, booleans,
 *   numbers), <sc-for list as>, <sc-if value>, inline style strings, JSX-style
 *   camelCase events (onClick, onChange, onKeyDown…), data-props defaults, and
 *   `class Component extends DCLogic { renderVals() {…} }` logic classes with
 *   React class semantics (state, setState, props, lifecycle).
 *
 * Works in the browser (src/dc-runtime.js) and in Node (tests/validate-designs.mjs).
 */
import React from 'react';

export const h = React.createElement;

// ---------------------------------------------------------------------------
// Minimal, tolerant HTML parser (no dependencies). Unlike the browser's
// DOMParser it keeps custom elements such as <sc-for> where they are written
// (even inside <select>) and preserves attribute case (onClick, viewBox).
// Nodes: { type: 'root'|'tag'|'text', name, attribs, children, data }.
// ---------------------------------------------------------------------------
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea', 'title']);
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', times: '×', copy: '©', larr: '←', rarr: '→' };

export function decodeEntities(s) {
  if (s.indexOf('&') < 0) return s;
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return Object.prototype.hasOwnProperty.call(NAMED, e) ? NAMED[e] : m;
  });
}

export function parseHTML(src) {
  const root = { type: 'root', name: '#root', attribs: {}, children: [] };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  let i = 0;
  const n = src.length;
  const pushText = (t) => { if (t) top().children.push({ type: 'text', data: decodeEntities(t) }); };
  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt < 0) { pushText(src.slice(i)); break; }
    if (lt > i) pushText(src.slice(i, lt));
    i = lt;
    if (src.startsWith('<!--', i)) { const e = src.indexOf('-->', i + 4); i = e < 0 ? n : e + 3; continue; }
    if (src[i + 1] === '!' || src[i + 1] === '?') { const e = src.indexOf('>', i); i = e < 0 ? n : e + 1; continue; }
    if (src[i + 1] === '/') {
      const e = src.indexOf('>', i);
      const name = src.slice(i + 2, e < 0 ? n : e).trim().toLowerCase();
      i = e < 0 ? n : e + 1;
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k].name.toLowerCase() === name) { stack.length = k; break; }
      }
      continue;
    }
    if (!/[A-Za-z]/.test(src[i + 1] || '')) { pushText('<'); i++; continue; }
    // start tag
    let j = i + 1;
    while (j < n && /[A-Za-z0-9:_-]/.test(src[j])) j++;
    const name = src.slice(i + 1, j);
    const attribs = {};
    let selfClose = false;
    while (j < n) {
      while (j < n && /\s/.test(src[j])) j++;
      if (src[j] === '>') { j++; break; }
      if (src[j] === '/' && src[j + 1] === '>') { selfClose = true; j += 2; break; }
      let k = j;
      while (k < n && !/[\s=>]/.test(src[k]) && !(src[k] === '/' && src[k + 1] === '>')) k++;
      const an = src.slice(j, k);
      j = k;
      while (j < n && /\s/.test(src[j])) j++;
      let val = '';
      if (src[j] === '=') {
        j++;
        while (j < n && /\s/.test(src[j])) j++;
        const q = src[j];
        if (q === '"' || q === "'") {
          const e = src.indexOf(q, j + 1);
          val = src.slice(j + 1, e < 0 ? n : e);
          j = e < 0 ? n : e + 1;
        } else {
          let e = j;
          while (e < n && !/[\s>]/.test(src[e])) e++;
          val = src.slice(j, e);
          j = e;
        }
      }
      if (an) attribs[an] = decodeEntities(val);
      if (!an) j++;
    }
    i = j;
    const node = { type: 'tag', name, attribs, children: [] };
    top().children.push(node);
    const lname = name.toLowerCase();
    if (selfClose || VOID.has(lname)) continue;
    if (RAW.has(lname)) {
      const re = new RegExp('</' + lname + '\\s*>', 'i');
      const rest = src.slice(i);
      const m = re.exec(rest);
      const raw = m ? rest.slice(0, m.index) : rest;
      if (raw) node.children.push({ type: 'text', data: lname === 'script' || lname === 'style' ? raw : decodeEntities(raw) });
      i += m ? m.index + m[0].length : rest.length;
      continue;
    }
    stack.push(node);
  }
  return root;
}

const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
const WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;

/** Resolve a dotted path or literal against a chain of scopes (innermost first). */
export function lookup(path, scopes) {
  const p = path.trim();
  if (p === 'true') return true;
  if (p === 'false') return false;
  if (p === 'null') return null;
  if (p === 'undefined') return undefined;
  if (/^-?\d+(\.\d+)?$/.test(p)) return Number(p);
  if (/^(['"]).*\1$/.test(p)) return p.slice(1, -1);
  const parts = p.split('.');
  for (const sc of scopes) {
    if (sc != null && Object.prototype.hasOwnProperty.call(sc, parts[0])) {
      let v = sc[parts[0]];
      for (let i = 1; i < parts.length; i++) {
        if (v == null) return undefined;
        v = v[parts[i]];
      }
      return v;
    }
  }
  return undefined;
}

/** Interpolate a string. A string that is exactly one hole returns the raw value. */
export function interp(str, scopes) {
  if (typeof str !== 'string' || str.indexOf('{{') < 0) return str;
  const m = str.match(WHOLE);
  if (m) return lookup(m[1], scopes);
  return str.replace(HOLE, (_, p) => {
    const v = lookup(p, scopes);
    return v == null ? '' : String(v);
  });
}

/** CSS declaration string -> React style object. */
export function parseStyle(s) {
  const out = {};
  if (!s || typeof s !== 'string') return out;
  const parts = [];
  let depth = 0;
  let cur = '';
  let quote = null;
  for (const ch of s) {
    if (quote) { if (ch === quote) quote = null; cur += ch; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  for (const part of parts) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    let key = part.slice(0, i).trim();
    const val = part.slice(i + 1).trim();
    if (!key) continue;
    if (key.startsWith('--')) { out[key] = val; continue; }
    key = key.replace(/^-(webkit|moz)-/, (_, v) => v.charAt(0).toUpperCase() + v.slice(1) + '-');
    key = key.replace(/^-ms-/, 'ms-');
    key = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = val;
  }
  return out;
}

const ATTR = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly',
  maxlength: 'maxLength', minlength: 'minLength', autocomplete: 'autoComplete',
  inputmode: 'inputMode', colspan: 'colSpan', rowspan: 'rowSpan', viewbox: 'viewBox',
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule',
  'xlink:href': 'xlinkHref', srcset: 'srcSet', crossorigin: 'crossOrigin',
  contenteditable: 'contentEditable', spellcheck: 'spellCheck', datetime: 'dateTime',
  autofocus: 'autoFocus', enterkeyhint: 'enterKeyHint'
};
const EVENTS = {
  onclick: 'onClick', onchange: 'onChange', oninput: 'onInput', onkeydown: 'onKeyDown',
  onkeyup: 'onKeyUp', onsubmit: 'onSubmit', onfocus: 'onFocus', onblur: 'onBlur',
  onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', ondoubleclick: 'onDoubleClick',
  ondblclick: 'onDoubleClick', onpointerdown: 'onPointerDown', onpointerup: 'onPointerUp'
};
const BOOL_ATTRS = ['disabled', 'checked', 'readOnly', 'required', 'multiple', 'hidden', 'autoFocus', 'selected'];

function mapAttr(name) {
  if (ATTR[name]) return ATTR[name];
  const l = name.toLowerCase();
  if (EVENTS[l]) return EVENTS[l];
  if (ATTR[l]) return ATTR[l];
  return name;
}

function textOf(node) {
  if (!node) return '';
  if (node.type === 'text') return node.data;
  return (node.children || []).map(textOf).join('');
}

function findFirst(node, pred) {
  if (pred(node)) return node;
  for (const c of node.children || []) {
    const f = findFirst(c, pred);
    if (f) return f;
  }
  return null;
}

/** Render template nodes to React children. */
export function renderNodes(nodes, scopes, ctx) {
  const out = [];
  (nodes || []).forEach((n, i) => {
    const r = renderNode(n, scopes, ctx, i);
    if (r != null) out.push(r);
  });
  return out;
}

function renderNode(n, scopes, ctx, key) {
  if (n.type === 'text') {
    if (!n.data.trim()) return null;
    const v = interp(n.data, scopes);
    return v == null ? null : String(v);
  }
  if (n.type !== 'tag') return null; // comments, scripts, styles, directives
  const tag = n.name;
  const lt = tag.toLowerCase();
  const a = n.attribs || {};

  if (lt === 'helmet' || lt === 'script' || lt === 'style') return null;
  if (lt === 'sc-if') {
    return interp(a.value || '', scopes) ? h(React.Fragment, { key }, ...renderNodes(n.children, scopes, ctx)) : null;
  }
  if (lt === 'sc-for') {
    const list = interp(a.list || '', scopes);
    const as = a.as || 'item';
    const arr = Array.isArray(list) ? list : [];
    return h(React.Fragment, { key }, ...arr.map((item, idx) =>
      h(React.Fragment, { key: idx }, ...renderNodes(n.children, [{ [as]: item, $index: idx }].concat(scopes), ctx))));
  }
  if (lt === 'dc-import') {
    return h('div', { key, style: { padding: 8, border: '1px dashed #c00', font: '12px monospace' } }, 'dc-import not supported in standalone viewer: ' + (a.name || ''));
  }

  if (ctx?.hidePhotos && lt === 'img' && !String(a.src || '').startsWith('/brand/')) return null;
  if (ctx?.hidePhotos && /ფოტო/.test(a['aria-label'] || '')) return null;
  if (ctx?.hidePhotos && lt === 'span' && /^Photo\s*·/i.test(textOf(n).trim())) return null;
  const props = { key };
  for (const rawName of Object.keys(a)) {
    if (rawName.startsWith('hint-')) continue;
    const name = mapAttr(rawName);
    const val = interp(a[rawName], scopes);
    if (name === 'style') { props.style = typeof val === 'string' ? parseStyle(val) : (val || undefined); continue; }
    if (/^on[A-Z]/.test(name)) { if (typeof val === 'function') props[name] = val; continue; }
    props[name] = val;
  }
  if (ctx?.hidePhotos && props.style?.backgroundImage?.includes('url(')) delete props.style.backgroundImage;
  for (const b of BOOL_ATTRS) {
    if (b in props) {
      const v = props[b];
      props[b] = v === true || v === '' || v === 'true' || v === b.toLowerCase();
    }
  }
  if (lt === 'input' || lt === 'textarea' || lt === 'select') {
    if ('value' in props) {
      if (props.value == null) props.value = '';
      if (!props.onChange) { props.defaultValue = props.value; delete props.value; }
    }
    if ('checked' in props && !props.onChange) { props.defaultChecked = props.checked; delete props.checked; }
  }
  if (lt === 'form' && !props.onSubmit) props.onSubmit = (e) => e.preventDefault();
  if (lt === 'a' && typeof props.href === 'string' && ctx && ctx.rewriteHref) props.href = ctx.rewriteHref(props.href);

  if (lt === 'textarea') {
    if (!('value' in props) && !('defaultValue' in props)) {
      const t = textOf(n);
      if (t) props.defaultValue = t;
    }
    return h(tag, props);
  }
  const children = renderNodes(n.children, scopes, ctx);
  return children.length ? h(tag, props, ...children) : h(tag, props);
}

/** Base class for prototype logic. Subclasses implement renderVals(). */
export class DCLogic extends React.Component {
  render() {
    const vals = typeof this.renderVals === 'function' ? this.renderVals() : {};
    return h(React.Fragment, null, ...renderNodes(this.__tpl, [vals || {}], this.__ctx));
  }
}

/**
 * Compile one .dc.html source into a React component.
 * @returns {{Component, defaultProps, links, styles, title, propsSpec}}
 */
export function compileScreen(source, ctx = {}) {
  const doc = parseHTML(source);
  const xdc = findFirst(doc, (x) => x.type === 'tag' && x.name === 'x-dc');
  if (!xdc) throw new Error('No <x-dc> root found');
  const script = findFirst(doc, (x) => x.name === 'script' && x.attribs && 'data-dc-script' in x.attribs);
  const titleNode = findFirst(doc, (x) => x.name === 'title');
  const helmet = (xdc.children || []).find((x) => x.type === 'tag' && x.name === 'helmet');
  const links = [];
  const styles = [];
  if (helmet) {
    for (const c of helmet.children || []) {
      if (c.name === 'link') links.push(Object.assign({}, c.attribs));
      if (c.name === 'style') styles.push(textOf(c));
    }
  }
  let propsSpec = {};
  let Component;
  if (script) {
    propsSpec = JSON.parse(script.attribs['data-props'] || '{}');
    const code = textOf(script);
    Component = new Function('DCLogic', 'React', code + '\n;return Component;')(DCLogic, React);
  } else {
    Component = class extends DCLogic {};
  }
  Component.prototype.__tpl = xdc.children;
  Component.prototype.__ctx = ctx;
  const defaultProps = {};
  for (const k of Object.keys(propsSpec)) {
    if (k.startsWith('$')) continue;
    if (propsSpec[k] && 'default' in propsSpec[k]) defaultProps[k] = propsSpec[k].default;
  }
  return { Component, defaultProps, links, styles, title: titleNode ? textOf(titleNode).trim() : '', propsSpec };
}

/** All `X.dc.html` link targets referenced by a source file. */
export function linkedScreens(source) {
  const out = new Set();
  const re = /(?:href=["']|['"])([A-Za-z0-9_-]+)\.dc\.html/g;
  let m;
  while ((m = re.exec(source))) out.add(m[1]);
  return [...out];
}
