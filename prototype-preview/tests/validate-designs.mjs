// Static validation of all approved prototypes (runs in Node, no browser):
//  - every artboard listed in canvas.json exists
//  - each file has an <x-dc> root and a valid data-dc-script logic class
//  - data-props JSON parses
//  - the component renders server-side without throwing (React renderToString)
//  - every link to another X.dc.html points at a file that exists
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { compileScreen, linkedScreens } from '../src/dc-parse.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'design', 'project');
const canvas = JSON.parse(fs.readFileSync(path.join(dir, 'canvas.json'), 'utf8'));
const files = canvas.order;
let failed = 0;

const origError = console.error;
const results = [];
for (const file of files) {
  const r = { file, ok: true, notes: [] };
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) { r.ok = false; r.notes.push('missing file'); results.push(r); continue; }
  const src = fs.readFileSync(p, 'utf8');
  let warnings = 0;
  console.error = () => { warnings++; };
  try {
    const scr = compileScreen(src, { rewriteHref: (x) => x });
    const html = renderToString(React.createElement(scr.Component, scr.defaultProps));
    r.notes.push('rendered ' + html.length + ' chars');
    if (warnings) r.notes.push(warnings + ' React warning(s)');
  } catch (e) {
    r.ok = false;
    r.notes.push('render error: ' + (e && e.message));
  } finally {
    console.error = origError;
  }
  for (const target of linkedScreens(src)) {
    if (!fs.existsSync(path.join(dir, target + '.dc.html'))) { r.ok = false; r.notes.push('broken link -> ' + target + '.dc.html'); }
  }
  if (!r.ok) failed++;
  results.push(r);
}

for (const r of results) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.file.padEnd(22) + r.notes.join(' · '));
console.log('\n' + (results.length - failed) + '/' + results.length + ' prototypes valid');
process.exit(failed ? 1 : 0);
