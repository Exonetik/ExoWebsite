/**
 * build-sitemap.js — regenerate sitemap.xml from the pages present on disk.
 *
 * Run it after adding or removing a page:  node tools/build-sitemap.js
 *
 * Every directory holding an index.html becomes a <url>. French and English
 * counterparts are paired with hreflang links, taken from the "urls" field of
 * the matching api/*.json when there is one, and from the table below for the
 * main pages.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.exonetik.com';

// main pages whose EN/FR slugs differ
const PAIRS = [
  ['/', '/fr'],
  ['/about-us', '/fr/a-propos'],
  ['/careers', '/fr/carrieres'],
  ['/technology', '/fr/technologie'],
  ['/medias', '/fr/medias'],
  ['/turbo', '/fr/turbo'],
  ['/contact-us', '/fr/contactez-nous'],
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name === 'tools') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === 'index.html') out.push(full);
  }
  return out;
}

const routeOf = f => {
  const r = '/' + path.relative(ROOT, f).split(path.sep).join('/').replace(/\/?index\.html$/, '');
  return r === '/' || r === '' ? '/' : r;
};

const routes = walk(ROOT).map(routeOf).sort();

// pair map: route -> { en, fr }
const pairOf = new Map();
for (const [en, fr] of PAIRS) { pairOf.set(en, { en, fr }); pairOf.set(fr, { en, fr }); }

// detail pages carry their own urls object in the API data
const detailDirs = [
  ['api/team-members', 'fr/api/team-members'],
  ['api/careers', 'fr/api/careers'],
  ['api/medias', 'fr/api/medias'],
];
for (const [enDir, frDir] of detailDirs) {
  for (const dir of [enDir, frDir]) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      if (!f.endsWith('.json')) continue;
      try {
        const j = JSON.parse(fs.readFileSync(path.join(abs, f), 'utf8'));
        if (j.urls && j.urls.en && j.urls.fr) {
          pairOf.set(j.urls.en, { en: j.urls.en, fr: j.urls.fr });
          pairOf.set(j.urls.fr, { en: j.urls.en, fr: j.urls.fr });
        }
      } catch (e) { /* data without urls: no hreflang pair */ }
    }
  }
}

const today = new Date().toISOString().slice(0, 10);
const esc = s => s.replace(/&/g, '&amp;');

const body = routes.map(r => {
  const loc = SITE + (r === '/' ? '/' : r);
  const pair = pairOf.get(r);
  const alts = pair && routes.includes(pair.en) && routes.includes(pair.fr)
    ? `\n    <xhtml:link rel="alternate" hreflang="en-CA" href="${esc(SITE + pair.en)}"/>` +
      `\n    <xhtml:link rel="alternate" hreflang="fr-CA" href="${esc(SITE + pair.fr)}"/>`
    : '';
  const priority = r === '/' || r === '/fr' ? '1.0' : r.split('/').length <= 2 ? '0.8' : '0.6';
  return `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${today}</lastmod>` +
         `\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>${alts}\n  </url>`;
}).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  body + `\n</urlset>\n`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml written with ${routes.length} urls.`);
