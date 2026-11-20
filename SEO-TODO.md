# Studio 93 — SEO to-do

What's still open after the SEO fixes on 2026-11-20 (redirects, title/description, h1 keyword, structured data, WebP images, icons, service text draft, accessibility).
Fill in the blanks, tick what's done, and send this file back to Claude.

---

## 1. Things Claude needs from you

- [ ] **Hero photo**: the main image at the top of the homepage (now a random placeholder from picsum.photos)
  - A real photo of your work or of Liptov, landscape, at least 1920 × 1280 px
  - Claude converts it to WebP and adds it to the site
  - File: `__________`
  - Short description of what's in the photo (for the alt text): `__________`

- [ ] **Phone number**: goes on the page (contact section) and into Google's structured data
  - Number: `__________`

- [ ] **Public address**: what Google should show (must match your Google Business Profile exactly)
  - [ ] Street address: `__________`
  - [ ] Or no street, only a service area ("Liptov")
  - The footer keeps showing the Trnava registered office either way. That's the legal company info.

- [ ] **Contact form URL**: right now the form goes nowhere (`YOUR_SCRIPT_ID`)
  - Deploy `form-mailer/Code.gs` as a Google Apps Script web app and copy its `/exec` URL
  - URL: `__________`

- [ ] **Service text**: proofread the draft Claude wrote
  - The second sentence on each of the 6 service cards + the new "Pre koho pracujeme" paragraph under them (Služby section, marked with a `DRAFT` comment in `alexa/index.html`). The English versions are in the `data-en` attributes next to them
  - [ ] OK as is
  - [ ] Changes: `__________`

- [ ] **Testimonials**: the 4 quotes on the homepage are invented placeholders
  - Collect real ones (quote + name or role + business + town), or decide to remove the section
  - Real testimonials:
    1. `__________`
    2. `__________`

- [ ] **Team**: photos and roles are placeholders
  - Portrait photos for Alexa Vachálková and Martin Pospíšil: **in color**, portrait orientation (4:5, at least 600 × 750 px). The site shows them black and white and turns them to color on hover
  - Roles: Alexa `__________`, Martin `__________`

- [ ] **Unnamed reels**: 3 portfolio reels are labelled just "Reel"
  - Client names for `reel-1`, `dielna`, `trend`: `__________`

- [ ] **Social profiles**: links to add next to Instagram (page footer + structured data)
  - Facebook: `__________`
  - TikTok: `__________`

- [ ] **Logo for Google** (optional): Claude made `alexa/assets/logo.png` (and the app icons) from the "93" favicon
  - If you have a real logo file (square, at least 512 × 512 px, PNG or SVG), send it and Claude swaps it in
  - File: `__________`

- [ ] **Opening hours** (optional): only if clients can visit you or call at set times. Goes into Google's structured data
  - Hours: `__________` (or "not needed")

- [ ] **Separate service pages** (optional, bigger job, best for ranking on more keywords)
  - Which services should get their own page? (e.g. správa sociálnych sietí, tvorba obsahu, reels & TikTok, web design, reklama)
  - For each one: a few paragraphs about what you do, for whom, prices or packages, examples

---

## 2. After uploading the site to Websupport

- [ ] Upload everything inside `alexa/`, **including the hidden `.htaccess` file**
  - New files: `assets/*.webp`, `assets/reels/*.webp`, `assets/logo.png`, `assets/favicon-48.png`, `assets/apple-touch-icon.png`
  - The old `.jpg` images (`assets/about-1.jpg`, `assets/about-2.jpg`, `assets/reels/*.jpg`) are no longer used and can be deleted on the server
- [ ] Check the redirects (run in a terminal, or ask Claude to):
  ```
  curl -sI http://studio93liptov.sk/ | head -3
  curl -sI http://www.studio93liptov.sk/ | head -3
  curl -sI https://www.studio93liptov.sk/ | head -3
  curl -sI https://studio93liptov.sk/index.html | head -3
  curl -sI https://studio93liptov.sk/ | head -3
  ```
  The first four must show `301` and `Location: https://studio93liptov.sk/`. The last must show `200`.
  **If the site stops loading (redirect loop):** delete the `<IfModule mod_rewrite.c>` block from `.htaccess` and tell Claude.
- [ ] Check the structured data: paste https://studio93liptov.sk/ into [search.google.com/test/rich-results](https://search.google.com/test/rich-results) and [validator.schema.org](https://validator.schema.org/); both should show no errors
- [ ] Run [pagespeed.web.dev](https://pagespeed.web.dev/) on https://studio93liptov.sk/ (mobile and desktop) and send the results to Claude

---

## 3. Off-site (outside the code, only you can do these)

- [ ] **Google Search Console**: verify the domain, submit `https://studio93liptov.sk/sitemap.xml`, request indexing of the homepage
- [ ] **Google Business Profile**: category (e.g. "Marketing agency" / "Social media agency"), service area Liptov, photos, website link, ask clients for reviews
- [ ] **Business listings**: firmy.sk, zoznam.sk, with the same name, address and phone everywhere
- [ ] **Social bios**: website link in the Instagram, Facebook and TikTok bios
- [ ] **Backlinks**: ask clients for a "Social media: STUDIO 93" link in their website footer (e.g. Vila27, Panduvia, Kovoliptov)
