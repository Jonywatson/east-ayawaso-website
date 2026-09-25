// Generates the home-screen icons in site/icons/ from the "BJ" emblem.
// Usage: node scripts/make-icons.mjs
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.resolve(import.meta.dirname, '..', 'site', 'icons');
await mkdir(outDir, { recursive: true });

// Full-bleed square so Android's round/squircle masks never cut the emblem.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#00703c"/>
  <rect y="452" width="171" height="60" fill="#c8102e"/>
  <rect x="171" y="452" width="170" height="60" fill="#ffffff"/>
  <rect x="341" y="452" width="171" height="60" fill="#141414"/>
  <text x="256" y="300" text-anchor="middle" font-family="Montserrat, Arial Black, Arial, sans-serif"
        font-weight="800" font-size="200" fill="#ffffff">BJ</text>
</svg>`;

for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(outDir, name));
  console.log(`icons/${name}`);
}
