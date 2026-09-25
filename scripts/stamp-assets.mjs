// Adds a content hash to the stylesheet and script links in every page
// (styles.css?v=1a2b3c4d), so phones fetch the new file straight after an
// update instead of using a cached copy that no longer matches the pages.
// Usage: npm run stamp (also part of npm run build)
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const siteDir = path.resolve(import.meta.dirname, '..', 'site');
const assets = ['css/styles.css', 'js/main.js'];

const hashes = {};
for (const asset of assets) {
  const body = await readFile(path.join(siteDir, asset));
  hashes[asset] = createHash('sha256').update(body).digest('hex').slice(0, 8);
}

const pages = (await readdir(siteDir)).filter(f => f.endsWith('.html'));
for (const page of pages) {
  const file = path.join(siteDir, page);
  let html = await readFile(file, 'utf8');
  for (const [asset, hash] of Object.entries(hashes)) {
    const escaped = asset.replace(/[.]/g, '\\.');
    html = html.replace(new RegExp(`(["'])${escaped}(\\?v=[0-9a-f]+)?\\1`, 'g'), `$1${asset}?v=${hash}$1`);
  }
  await writeFile(file, html);
}
console.log(`Stamped ${pages.length} pages: ${Object.entries(hashes).map(([a, h]) => `${a}?v=${h}`).join(', ')}`);
