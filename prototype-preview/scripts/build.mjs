// Builds the standalone viewer into dist/:
//   dist/index.html, dist/assets/main.js (React + runtime bundle), dist/project/* (design files)
// Usage: node scripts/build.mjs [--serve] [--port=5173]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const serve = process.argv.includes('--serve');
const portArg = process.argv.find((a) => a.startsWith('--port='));
const port = portArg ? Number(portArg.split('=')[1]) : 5173;

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
fs.cpSync(path.join(root, 'design', 'project'), path.join(dist, 'project'), { recursive: true });
fs.copyFileSync(path.join(root, 'index.html'), path.join(dist, 'index.html'));
fs.copyFileSync(path.join(root, 'src', 'venue-collections.css'), path.join(dist, 'assets', 'venue-collections.css'));
fs.copyFileSync(path.join(root, 'src', 'restaurant-menu.css'), path.join(dist, 'assets', 'restaurant-menu.css'));
fs.copyFileSync(path.join(root, 'src', 'mobile-experience.css'), path.join(dist, 'assets', 'mobile-experience.css'));
fs.cpSync(path.join(root, 'assets', 'brand'), path.join(dist, 'brand'), { recursive: true });

const options = {
  entryPoints: [path.join(root, 'src', 'main.js')],
  bundle: true,
  format: 'esm',
  target: 'es2020',
  outfile: path.join(dist, 'assets', 'main.js'),
  minify: !serve,
  sourcemap: serve ? 'inline' : false,
  define: { 'process.env.NODE_ENV': serve ? '"development"' : '"production"' },
  logLevel: 'info'
};

if (serve) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  const { port: p } = await ctx.serve({ servedir: dist, port });
  console.log('Episode prototypes: http://localhost:' + p + '/');
  // Design files are copied once at start; restart after editing design/ files.
} else {
  await esbuild.build(options);
  console.log('Built to ' + path.relative(root, dist) + '/');
}
