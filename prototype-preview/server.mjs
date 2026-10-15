import { handleBookingRequest } from './src/booking-api.mjs';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { screenFromPath, collectionFromPath, menuFromPath, bookingFromPath } from './src/screen-routes.js';

// Resolve relative to this file, not process.cwd(): Cloud may launch from repo root.
const appRoot = dirname(fileURLToPath(import.meta.url));
const root = resolve(appRoot, 'dist');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};
const port = Number(process.env.PORT ?? '3000');
// Cloud's readiness checks connect via IPv6. Listen on the IPv6 wildcard,
// which also accepts IPv4 on dual-stack Linux (ipv6Only: false).
// HOST is optional for local troubleshooting; production defaults to ::.
const host = process.env.HOST || '::';
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer from 1 to 65535');
}

const headers = {
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
};

const server = createServer(async (req, res) => {
  if ((req.url || '').split('?')[0] === '/api/booking-requests') return handleBookingRequest(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Method Not Allowed');
    return;
  }

  let full;
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').includes('..')) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    // Laravel Cloud readiness probes may use /, /up, /health or /healthz.
    // All are answered by the same built index file: no false success if
    // deployment assets are missing.
    const relativePath = (['/', '/screens', '/up', '/health', '/healthz'].includes(pathname) || screenFromPath(pathname) !== null || collectionFromPath(pathname) !== null || menuFromPath(pathname) !== null || bookingFromPath(pathname) !== null)
      ? '/index.html'
      : pathname;
    full = resolve(root, '.' + relativePath);
    if (full !== root && !full.startsWith(root + sep)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const info = await stat(full);
    if (!info.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const data = await readFile(full);
    res.writeHead(200, { ...headers, 'Content-Type': types[extname(full)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? null : data);
  } catch (error) {
    if (full?.endsWith('/index.html')) {
      console.error('Readiness failed: built dist/index.html is unavailable at', full, error?.code || error?.message);
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Preview assets not built');
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

server.on('error', (error) => {
  console.error('Episode preview server failed to start:', error);
  process.exitCode = 1;
});
server.listen({ port, host, ipv6Only: false }, () => {
  console.log('Episode preview listening at http://' + host + ':' + port + ' (assets: ' + root + ')');
});
