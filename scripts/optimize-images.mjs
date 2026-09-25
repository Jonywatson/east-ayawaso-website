// Converts the originals in photos/ to resized WebP files in site/images/,
// then writes the gallery markup into site/gallery.html and site/index.html.
// Usage: npm run images
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const photosDir = path.join(root, 'photos');
const outDir = path.join(root, 'site', 'images');
const WIDTHS = [480, 960, 1600];
const QUALITY = 78;

const escape = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function convert(photo) {
  let base = sharp(path.join(photosDir, photo.file)).rotate(); // apply EXIF orientation
  if (photo.crop) base = base.extract(photo.crop);
  const { width: srcW, height: srcH } = photo.crop ?? (await base.metadata());

  // Never upscale: keep only target widths smaller than the source, plus the source width itself.
  const widths = [...new Set([...WIDTHS.filter(w => w < srcW), Math.min(srcW, WIDTHS.at(-1))])];
  const files = [];
  for (const w of widths) {
    const name = `${photo.id}-${w}.webp`;
    // sharp drops EXIF/GPS metadata by default, so no location data is published.
    const info = await base.clone().resize({ width: w }).webp({ quality: QUALITY }).toFile(path.join(outDir, name));
    files.push({ name, width: w, height: info.height, bytes: info.size });
  }
  return { ...photo, files, ratio: srcW / srcH };
}

function srcset(p) {
  return p.files.map(f => `images/${f.name} ${f.width}w`).join(', ');
}

function figure(p, sizes, index) {
  const loading = index < 2 ? 'eager' : 'lazy'; // photos visible on first screen load straight away
  const small = p.files[0];
  const large = p.files.at(-1);
  const credit = p.credit ? `<span class="credit">Photo: ${escape(p.credit)}</span>` : '';
  return `      <figure class="gallery-item">
        <a href="images/${large.name}" data-lightbox data-caption="${escape(p.caption)}">
          <img src="images/${small.name}" srcset="${srcset(p)}" sizes="${sizes}"
               width="${small.width}" height="${small.height}" alt="${escape(p.alt)}" loading="${loading}" decoding="async">
        </a>
        <figcaption>${escape(p.caption)}${credit}</figcaption>
      </figure>`;
}

async function inject(file, marker, html) {
  const full = path.join(root, 'site', file);
  const text = await readFile(full, 'utf8');
  const re = new RegExp(`(<!-- ${marker}:START -->)[\\s\\S]*?(\\s*<!-- ${marker}:END -->)`);
  if (!re.test(text)) throw new Error(`${file} is missing the ${marker} markers`);
  await writeFile(full, text.replace(re, `$1\n${html}$2`));
}

const manifest = JSON.parse(await readFile(path.join(photosDir, 'photos.json'), 'utf8'));
await mkdir(outDir, { recursive: true });

const done = [];
for (const photo of manifest) {
  const result = await convert(photo);
  done.push(result);
  const kb = result.files.map(f => `${f.width}w ${Math.round(f.bytes / 1024)}KB`).join(', ');
  console.log(`${photo.id.padEnd(24)} ${kb}`);
}

const gallery = done.filter(p => p.gallery);
const gallerySizes = '(min-width: 1000px) 320px, (min-width: 600px) 45vw, 92vw';
await inject('gallery.html', 'GALLERY', gallery.map((p, i) => figure(p, gallerySizes, i)).join('\n'));
await inject('index.html', 'PREVIEW', gallery.slice(1, 4).map(p => figure(p, gallerySizes, 99)).join('\n'));
console.log(`\nGallery updated with ${gallery.length} photos.`);
