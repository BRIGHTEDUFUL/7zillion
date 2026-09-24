# Roadmap

- [x] Add shared internal-page layout and content.
- [x] Create pages for Products, Solutions, Projects, Services, About, Blog, and Contact.
- [x] Update all homepage navigation and content links to working destinations.
- [x] Fix the current homepage hydration warning.
- [x] Verify every internal link and page on desktop and mobile.

## Verification record

- `npx tsc --noEmit` — 0 errors.
- `npm run lint` — 0 errors (6 pre-existing `react-refresh/only-export-components`
  warnings in `src/components/ui/*`, untouched by this work).
- `npm run build` — passes (client + server + Nitro/Cloudflare).
- Hero harness — 46/46 assertions, 0 console/page errors, at 1440 / 768 / 390 px.
- Link crawl — 49 URLs, 0 non-200, 0 broken in-page anchors.
- Route checks — every page has exactly one `<h1>`, brand `| Seven Zillions`
  title, breadcrumbs (except home), `logo-color.png` present, and zero
  `lovable` / `HZM` occurrences.
- Images — 20 shipped assets, 0 unused. `logo-white.png` deleted; the white
  knockout is `filter: brightness(0) invert(1)` on the single logo.
- Favicon — regenerated from the violet mark: PNG-based ICO at 48/32/16,
  420 opaque pixels, all brand violet `#3A0050`, centred (was a white logo
  that rendered invisible on light tabs).
