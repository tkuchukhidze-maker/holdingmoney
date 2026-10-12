import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
const port = Number(process.env.PORT || '8080');
if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error('Invalid PORT');
createServer(async(req,res)=>{
  if (req.method !== 'GET' && req.method !== 'HEAD') {res.writeHead(405);res.end('Method Not Allowed');return;}
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const rawPath = decodeURIComponent(url.pathname);
    if (rawPath.includes('\\') || rawPath.includes('\\0') || rawPath.includes('..')) {res.writeHead(403);res.end('Forbidden');return;}
    const full = resolve(root, '.'+ (rawPath==='/' ? '/index.html' : rawPath));
    if (full !== root && !full.startsWith(root+sep)) {res.writeHead(403);res.end('Forbidden');return;}
    const info = await stat(full);
    if (!info.isFile()) {res.writeHead(404);res.end('Not Found');return;}
    const data = await readFile(full);
    res.writeHead(200,{'Content-Type':types[extname(full)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});
    res.end(req.method==='HEAD'?null:data);
  } catch(e){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not Found');}
}).listen(port,'0.0.0.0',()=>console.log('Episode prototype preview available on port '+port));
