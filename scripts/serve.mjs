// Minimal static server for previewing the site locally: npm start
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const siteDir = path.resolve(import.meta.dirname, '..', 'site');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
};

http.createServer(async (req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const file = path.join(siteDir, path.normalize(urlPath));
  if (!file.startsWith(siteDir)) return res.writeHead(403).end();
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(PORT, () => console.log(`Preview: http://localhost:${PORT}`));
