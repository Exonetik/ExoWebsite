# exonetik.com — static mirror

This is a static snapshot of www.exonetik.com, captured on 2026-09-04 to replace
the old Craft CMS installation. From now on, content is edited directly in these
source files — there is no CMS or database behind this site.

## How it was made

The live site's public front-end is a Vue.js single-page app that reads its
content from Craft via JSON endpoints under `/api/*` — Craft itself never
server-rendered the HTML. So a plain mirror (wget/HTTrack) would only have
captured an empty app shell. Instead, every URL in the site's sitemap was
rendered in a headless browser (like a real visitor's browser would), and:

- the fully rendered DOM was saved as `<path>/index.html`
- every same-origin resource the page loaded (JS, CSS, images, and — importantly —
  the `/api/*.json` files the Vue app fetches for its content) was saved at the
  exact same path it had on the live site

Because all internal links are root-relative, nothing needed to be rewritten —
serve this folder as the site root and it behaves the same as the live site did
at capture time, including the `/api/*.json` calls the front-end still makes.

See `crawl-report.json` for the full list of pages, assets, and external hosts
referenced.

## Previewing locally

Any static file server works, e.g.:

```
npx serve .
# or
python -m http.server 8080
```

Open `http://localhost:8080/`. Do **not** just double-click `index.html` —
the app's relative fetches to `/api/...` need to be served from a root, not
opened via `file://`.

## What still needs attention

1. **Forms** (contact / quote-request / careers apply) — previously submitted
   to Craft. You said you'd wire these up yourselves; the markup is intact,
   but nothing currently handles submission.
2. **External services left as-is** (still point at their live third-party
   hosts, not mirrored — this is normal and expected):
   - Google Tag Manager / Analytics
   - Google Maps
   - Google Fonts
   - Vimeo (video embeds)
   - Product/photo images on S3 (`s3.us-east-2.amazonaws.com/exonetik/...`) —
     these are already-generated files, independent of Craft, so they'll keep
     working after Craft is shut down. Worth eventually pulling a copy into
     this repo so the site has no remaining external dependency on that bucket.
3. **The `/api/*.json` files are frozen snapshots.** The Vue app still fetches
   them at runtime, which works fine as static files, but editing content now
   means hand-editing both the visible HTML *and* the matching JSON under
   `/api/` (e.g. a team member's bio lives in both `about-us/<name>/index.html`
   and `api/team-members/<name>.json`). This duplication is a rough edge of
   freezing a JS-driven site — worth simplifying later if this becomes hard to
   maintain (e.g. by stripping the Vue app down to plain HTML/CSS).
4. **Not captured / not checked:** any server-side redirects Craft was doing
   (old URLs, trailing slashes), and a custom 404 page. Worth checking Craft's
   redirect settings before decommissioning it, and adding a `404.html`.
5. **robots.txt / sitemap.xml** were not copied into this repo — add updated
   versions before this goes live as the real site.
