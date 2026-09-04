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

## Offline assets

All product/team/story photos and the datasheet PDF that used to live on the
Craft S3 bucket (`s3.us-east-2.amazonaws.com/exonetik/assets-prod/...`) are
now mirrored locally under `exonetik/assets-prod/`, and every reference to
them was rewritten to a relative path. There are no non-Vimeo videos on the
site (checked — the only video embeds are Vimeo). Vimeo was left external on
purpose (per request).

Fonts (`static/fonts/`) and every `/api/*.json` payload are also already
local from the initial mirror — see below.

## What still needs attention

1. **Forms** (contact / quote-request / careers apply) — previously submitted
   to Craft. You said you'd wire these up yourselves; the markup is intact,
   but nothing currently handles submission.
2. **External services that can't be made to work fully offline** (by nature —
   they're live third-party services, not static files):
   - **Google Maps** on the contact page — needs internet to render at all;
     with no connection the map area will show broken/blank. This is the one
     visible gap for a true offline demo. If that matters, the fix would be
     swapping the live embed for a static map image on that page — say the
     word and I'll do it.
   - **Vimeo** video embeds — excluded per your request, still external.
   - **Google Analytics / Tag Manager** — calls fail silently with no
     internet, no visible impact.
   - (BugHerd's widget script is present in the bundle but dead code — its
     activation flag isn't set in the production build, so it never loads.)
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
6. Cosmetic only: the datasheet page's visible link text literally reads
   `https://s3.us-east-2.amazonaws...` (that's what was typed into the CMS
   field) even though the link itself now correctly points to the local PDF.
   Worth relabeling if you're touching that page anyway.
