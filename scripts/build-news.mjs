// Builds the News pages from content/news.json:
//   site/news.html            list of all items, newest first
//   site/news-<slug>.html     one page per item, with share buttons
//   site/index.html           "Latest news" cards and the pinned announcement strip
// Usage: npm run news
import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const siteDir = path.join(root, 'site');

const escape = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const formatDate = iso =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const arrow = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const items = JSON.parse(await readFile(path.join(root, 'content', 'news.json'), 'utf8'))
  .sort((a, b) => b.date.localeCompare(a.date));
for (const item of items) {
  for (const key of ['slug', 'date', 'category', 'title', 'summary', 'body']) {
    if (!item[key]) throw new Error(`News item "${item.title ?? item.slug}" is missing "${key}"`);
  }
  if (!/^[a-z0-9-]+$/.test(item.slug)) throw new Error(`Slug "${item.slug}" may only use a-z, 0-9 and dashes`);
}

// Optimised photos made by `npm run images`, looked up by id.
const imageFiles = await readdir(path.join(siteDir, 'images'));
function imageSet(id) {
  const widths = imageFiles
    .map(f => f.match(new RegExp(`^${id}-(\\d+)\\.webp$`))?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
  if (!widths.length) throw new Error(`No optimised image "${id}". Add it to photos/photos.json and run npm run images.`);
  return { src: `images/${id}-${widths[0]}.webp`, srcset: widths.map(w => `images/${id}-${w}.webp ${w}w`).join(', '), largest: `images/${id}-${widths.at(-1)}.webp` };
}

const chip = item =>
  `<span class="chip chip--${item.category.toLowerCase()}">${escape(item.category)}</span>` +
  (item.sample ? '<span class="chip chip--sample">Sample</span>' : '');

function card(item) {
  const media = item.image
    ? (() => { const img = imageSet(item.image); return `<img src="${img.src}" srcset="${img.srcset}" sizes="(min-width: 1000px) 360px, 90vw" alt="" loading="lazy" decoding="async">`; })()
    : `<span class="news-card-fallback" aria-hidden="true">${escape(item.category)}</span>`;
  return `      <article class="news-card">
        <a class="news-card-media" href="news-${item.slug}.html" tabindex="-1" aria-hidden="true">${media}</a>
        <div class="news-card-body">
          <p class="news-meta">${chip(item)}<time datetime="${item.date}">${formatDate(item.date)}</time></p>
          <h3><a href="news-${item.slug}.html">${escape(item.title)}</a></h3>
          <p>${escape(item.summary)}</p>
          <a class="read-more" href="news-${item.slug}.html">Read more ${arrow}</a>
        </div>
      </article>`;
}

// Page shell taken from index.html so header, nav and footer stay identical.
const index = await readFile(path.join(siteDir, 'index.html'), 'utf8');
const shellHead = index.slice(0, index.indexOf('<main id="main">'));
const shellFoot = index.slice(index.indexOf('  </main>'));
function page(title, description, main) {
  const head = shellHead
    .replace(/<title>.*<\/title>/, `<title>${escape(title)} | Hon. Ahmed Baba Jamal, MP for East Ayawaso</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escape(description)}">`)
    .replaceAll(' aria-current="page"', '')
    .replace('<a href="news.html">', '<a href="news.html" aria-current="page">');
  return `${head}<main id="main">\n${main}\n${shellFoot}`;
}

// News list page
await writeFile(path.join(siteDir, 'news.html'), page('News & announcements',
  'News, announcements and events from the office of Hon. Ahmed Baba Jamal, MP for East Ayawaso.', `    <section class="page-head">
      <div class="container">
        <h1>News &amp; announcements</h1>
        <p>Updates, notices and events from the MP's office.</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="news-grid">
${items.map(card).join('\n')}
        </div>
      </div>
    </section>
  `));

// One page per item
for (const f of (await readdir(siteDir)).filter(f => /^news-.+\.html$/.test(f))) await unlink(path.join(siteDir, f));
for (const item of items) {
  const img = item.image && imageSet(item.image);
  const figure = img
    ? `        <figure class="article-image"><img src="${img.src}" srcset="${img.srcset}" sizes="(min-width: 800px) 720px, 92vw" alt="" decoding="async"></figure>\n`
    : '';
  const others = items.filter(i => i !== item).slice(0, 2);
  await writeFile(path.join(siteDir, `news-${item.slug}.html`), page(item.title, item.summary, `    <section class="page-head page-head--article">
      <div class="container">
        <p class="news-meta">${chip(item)}<time datetime="${item.date}">${formatDate(item.date)}</time></p>
        <h1>${escape(item.title)}</h1>
      </div>
    </section>
    <section class="section">
      <div class="container article">
${figure}        <div class="prose">
${item.body.map(p => `          <p>${escape(p)}</p>`).join('\n')}
        </div>
        <div class="share" data-share-title="${escape(item.title)}">
          <span class="share-label">Share this</span>
          <a class="share-btn share-btn--whatsapp" href="#" data-share="whatsapp">WhatsApp</a>
          <a class="share-btn" href="#" data-share="facebook">Facebook</a>
          <button class="share-btn" type="button" data-share="copy">Copy link</button>
        </div>
        <p><a class="read-more" href="news.html">${arrow} All news &amp; announcements</a></p>
      </div>
    </section>
${others.length ? `    <section class="section section--paper">
      <div class="container">
        <h2>More news</h2>
        <div class="news-grid">
${others.map(card).join('\n')}
        </div>
      </div>
    </section>` : ''}
  `));
}

// Home page: latest three + pinned announcement strip
const pinned = items.find(i => i.pinned);
const strip = pinned ? `    <aside class="announcement" aria-label="Announcement">
      <div class="container announcement-inner">
        <span class="announcement-tag">Announcement</span>
        <p><strong>${escape(pinned.title)}.</strong> ${escape(pinned.summary)}</p>
        <a href="news-${pinned.slug}.html">Details ${arrow}</a>
      </div>
    </aside>` : '';
let home = await readFile(path.join(siteDir, 'index.html'), 'utf8');
const inject = (text, marker, html) => {
  const re = new RegExp(`(<!-- ${marker}:START -->)[\\s\\S]*?(\\s*<!-- ${marker}:END -->)`);
  if (!re.test(text)) throw new Error(`index.html is missing the ${marker} markers`);
  return text.replace(re, `$1\n${html}$2`);
};
home = inject(home, 'NEWS', items.slice(0, 3).map(card).join('\n'));
home = inject(home, 'ANNOUNCEMENT', strip);
await writeFile(path.join(siteDir, 'index.html'), home);

console.log(`Built news.html and ${items.length} article pages${pinned ? `; pinned: "${pinned.title}"` : ''}.`);
