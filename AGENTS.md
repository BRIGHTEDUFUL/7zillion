# AGENTS.md

Seven Zillions corporate site — TanStack Start (React SSR) + Convex backend,
deployed as a Node app on Hostinger.

## Commands

```sh
npm run dev          # dev server (vite)
npm run build        # production build → .output/
npm start             # run the built server (reads PORT, defaults 3000)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (0 errors allowed; 6 pre-existing warnings)
npm test             # vitest (99 tests)
npm run format       # prettier --write
```

Gate before any push: `npm run typecheck && npm run lint && npm test && npm run build`.

## Architecture

- **Frontend/SSR**: TanStack Start, file routes in `src/routes/`, generated
  `src/routeTree.gen.ts` (never hand-edit).
- **Backend**: Convex (cloud). The app talks to it over HTTP only — no
  `convex/browser` imports in `src/`. Deployed deployment:
  `https://mild-dachshund-456.convex.cloud`. Push function/schema changes with
  `npx convex deploy` (needs `CONVEX_DEPLOY_KEY`).
- **Server entry**: `src/server.ts` — loads `.env`/`.env.local` (real env wins),
  answers `GET /api/health`, wraps SSR errors into an HTML page. Nitro preset is
  `node-server` (vite.config.ts); `wrangler.toml`/Cloudflare artifacts are gone —
  do not reintroduce them.
- **Admin**: `/admin` subtree, bcrypt auth in `src/lib/auth.ts`, sessions in
  Convex (`auth:createSession` etc.), cookie `admin_session` (httpOnly +
  SameSite=Strict; `Secure` whenever the request arrives over HTTPS), and an
  in-process rate limit of 10 failed attempts / 15 min per IP (shared by login
  and the Settings password/username changes; successful attempts never count).
  Every shared auth rule — constants, zod schemas, error codes and messages —
  lives in `src/lib/auth-contract.ts`, which the frontend forms and the server
  functions both import. Password is changeable from **Admin → Settings**: the
  new hash lands in the Convex `adminCredentials` singleton and overrides
  `ADMIN_USERNAME`/`ADMIN_PASSWORD_HASH`, which stay as the bootstrap fallback.
- **Deployment**: `docs/DEPLOY_HOSTINGER.md` (hPanel Node.js web app: build
  `npm run build`, entry `.output/server/index.mjs`, Node 24, env vars in panel).
- **Content**: every shared record is a Convex singleton holding a JSON string
  (`content:*` functions): `company` (Admin → Company), `services` (Admin →
  Services), `videos` (Admin → Videos) and `pages` (Admin → Page content — the
  /about copy, the equipment and production line lists, support lines and the
  /contact checklist). Public reads live in `src/api/*` and merge the stored row
  over the built-in copy (`fallbackCompany`, `defaultPages`, `defaultVideos` in
  `src/data/site.ts`), logging and falling back on error, so a missing row or an
  undeployed table never blanks a block. Blank rows from the list editors are
  dropped on save (`sanitizePages`, `sanitizeVideos` in `src/lib/site-content.ts`).
- **Company record in the layout**: the root route loads it once per
  navigation and `SiteCompanyProvider` (`src/components/site-company-provider.tsx`)
  publishes it to the footer, contact rail, CTA bars and quote form through
  `useSiteCompany()`. Components must not import `company` from `src/data/site`.

## House rules

- Copy language: "A–Z" for scope/coverage; "Turnkey" only inside package names
  (see comment in `src/data/site.ts`).
- No prices anywhere (site, tests, DB) — pricing is quote-based; keep the FAQ
  answer explaining how a quote is calculated.
- Images upload straight to Convex storage (presigned URL), never to local disk.
- YouTube: `videoUrl` field on projects/products renders `YouTubeEmbed`
  (click-to-play facade) — any watch/shorts/embed URL is accepted. The public
  gallery (homepage `#videos` section and `/videos`, edited in Admin → Videos)
  uses `VideoGallery` + `VideoLightbox` instead: a thumbnail grid that opens a
  full-screen player, again with no iframe until a visitor presses play.
  `src/lib/youtube.ts` owns the URL maths — `toAspect()` reads a
  `youtube.com/shorts/…` link as `9:16` so a vertical clip is framed portrait
  rather than letterboxed inside 16:9 (a vertical clip reached through a
  `youtu.be` or `/watch` URL has no such signal and stays `16:9`).
- Never commit `.env` / `.env.local` (git-ignored; `.env.example` is the template).
