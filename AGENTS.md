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
npm test             # vitest (50 tests)
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
  Convex (`auth:createSession` etc.), cookie `admin_session` (Secure → HTTPS
  required), rate limit 10 attempts / 15 min per IP.
- **Deployment**: `docs/DEPLOY_HOSTINGER.md` (hPanel Node.js web app: build
  `npm run build`, entry `.output/server/index.mjs`, Node 24, env vars in panel).

## House rules

- Copy language: "A–Z" for scope/coverage; "Turnkey" only inside package names
  (see comment in `src/data/site.ts`).
- No prices anywhere (site, tests, DB) — pricing is quote-based; keep the FAQ
  answer explaining how a quote is calculated.
- Images upload straight to Convex storage (presigned URL), never to local disk.
- YouTube: `videoUrl` field on projects/products renders `YouTubeEmbed`
  (click-to-play facade) — any watch/shorts/embed URL is accepted.
- Never commit `.env` / `.env.local` (git-ignored; `.env.example` is the template).
