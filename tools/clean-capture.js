/**
 * clean-capture.js — run this after re-rendering any page from a browser.
 *
 * Capturing a page from a desktop preview bakes two things into the HTML that
 * must not ship:
 *   1. the preview URL (http://localhost:3000/...) in canonical / og:url /
 *      twitter:url — the app sets canonical from window.location at runtime,
 *      so whatever host was used during the capture ends up in the file;
 *   2. the smooth-scroll library's classes on <html> (has-scroll-smooth,
 *      has-scroll-init), which disable native scrolling on phones.
 *
 * Usage:  node tools/clean-capture.js            (cleans every .html file)
 *         node tools/clean-capture.js path/a.html path/b.html
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.exonetik.com';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules' || e.name === 'tools') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function clean(file) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;

  // 1. preview host -> public domain
  after = after.replace(/https?:\/\/localhost(?::\d+)?/g, SITE)
               .replace(/https?:\/\/127\.0\.0\.1(?::\d+)?/g, SITE);

  // 2. drop the third-party tags the Google Maps widget injects into the page
  //    while it runs. Captured, they make every visitor load Google Maps and
  //    Google Fonts even though the map itself is no longer on the page, and
  //    they pile up with each capture.
  after = after
    .replace(/<script[^>]*src="https:\/\/maps\.(googleapis|gstatic)\.com[^"]*"[^>]*>\s*<\/script>/g, '')
    .replace(/<link[^>]*href="https:\/\/fonts\.(googleapis|gstatic)\.com[^"]*"[^>]*>/g, '')
    .replace(/<link[^>]*href="https:\/\/maps\.gstatic\.com[^"]*"[^>]*>/g, '');

  // 3. drop the desktop smooth-scroll state from <html>
  after = after.replace(/<html([^>]*)>/, (m, attrs) =>
    '<html' + attrs.replace(/\s*class="([^"]*)"/, (full, cls) => {
      const kept = cls.split(/\s+/).filter(c => c && c !== 'has-scroll-smooth' && c !== 'has-scroll-init');
      return kept.length ? ` class="${kept.join(' ')}"` : '';
    }) + '>');

  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    return true;
  }
  return false;
}

const args = process.argv.slice(2);
const files = args.length ? args.map(a => path.resolve(ROOT, a)) : walk(ROOT);
let changed = 0;
for (const f of files) if (clean(f)) { changed++; console.log('cleaned', path.relative(ROOT, f)); }
console.log(`${files.length} file(s) checked, ${changed} cleaned.`);
