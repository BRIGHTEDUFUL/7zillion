# Seven Zillions

Corporate website for **Seven Zillions** — *Cooperation and Interdependence*.
Turnkey production lines and industrial engineering, Kumasi, Ghana — [www.sevenzillions.com](https://www.sevenzillions.com).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React SSR) |
| Backend / database | [Convex](https://convex.dev) |
| Hosting | Hostinger Node.js |
| Admin panel | `/admin` route subtree with bcrypt auth |

---

## Development

Prefer working locally? You need Node.js ≥ 20 and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
cp .env.example .env   # fill in CONVEX_URL, CONVEX_DEPLOY_KEY and ADMIN_* values
npx convex dev         # starts the Convex backend and generates convex/_generated/
npm run dev            # starts the TanStack Start dev server
```

`.env.local` is the preferred place for `CONVEX_DEPLOY_KEY` — the Convex CLI
writes it there automatically, and git ignores `*.local`.

---

## Convex setup (first time)

1. Create a free account at [dashboard.convex.dev](https://dashboard.convex.dev)
2. Create a new project
3. Copy the **Deployment URL** from Settings → it looks like `https://happy-animal-123.convex.cloud`
4. Paste it into `.env` as `CONVEX_URL=https://...`
5. Copy the **Deploy key** from Settings into `.env` (or `.env.local`) as `CONVEX_DEPLOY_KEY=...`.
   It authenticates `npx convex deploy` and every admin-panel write. Treat it like a database password.
6. Run `npx convex dev` - this generates `convex/_generated/` and pushes the schema
7. Seed initial data: `node scripts/seed-convex.ts` (writes `scripts/.seed/*.json`, then imports
   each table with `npx convex import`)

---

## Generating the admin password hash

```sh
node -e "const b=require('bcryptjs'); b.hash('your-password', 10).then(h => console.log(h))"
```

Copy the output into `.env` as `ADMIN_PASSWORD_HASH`.

---

## Building for production

```sh
npm run build        # outputs to .output/
```

The build produces:
- `.output/server/index.mjs` — Node.js HTTP server entry point
- `.output/public/` — static assets (JS, CSS, images)

---

## Deploying to Hostinger

Full step-by-step guide: **[docs/DEPLOY_HOSTINGER.md](docs/DEPLOY_HOSTINGER.md)**
(Business/Cloud plan → hPanel → Websites → Add Website → Node.js web app).

Short version:

1. **Convex is already live** — schema, functions, and seed data are on the
   `mild-dachshund-456` deployment. Push code changes later with
   `npx convex deploy` (needs `CONVEX_DEPLOY_KEY`).
2. **Push this repo to GitHub** (never commit `.env` / `.env.local`).
3. **hPanel → Websites → Add Website → Node.js web app** → import the repo:
   - Build command: `npm run build`
   - Entry file: `.output/server/index.mjs`
   - Node.js version: **24**
4. **Set environment variables** in the app's panel:

   | Variable | Value |
   |---|---|
   | `CONVEX_URL` | `https://mild-dachshund-456.convex.cloud` |
   | `CONVEX_DEPLOY_KEY` | deploy key (Convex dashboard → Settings → Deploy key) |
   | `ADMIN_USERNAME` | admin username |
   | `ADMIN_PASSWORD_HASH` | bcrypt hash |
   | `NODE_ENV` | `production` |

5. **Verify**: `https://yourdomain.com/api/health` returns
   `{"ok":true,...}`, then load `/`, `/admin/login`, and log in.

Pre-flight before every push:

```sh
npm run typecheck && npm run lint && npm test && npm run build
```

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `CONVEX_URL` | ✓ | Convex deployment URL (from Convex dashboard) |
| `CONVEX_DEPLOY_KEY` | ✓ | Convex deploy key; lets the server call `internalMutation` and lets `npx convex deploy` push code |
| `ADMIN_USERNAME` | ✓ | Admin panel login username |
| `ADMIN_PASSWORD_HASH` | ✓ | bcrypt hash of admin password (cost 10) |
| `NODE_ENV` | — | Set to `production` on Hostinger |
| `PORT` | — | Port for the Node server (Hostinger assigns automatically) |

A template is at `.env.example`.

---

## Admin panel

Visit `/admin` — you'll be redirected to `/admin/login`.
Log in with the username and password whose hash is in `ADMIN_PASSWORD_HASH`.

The admin panel lets you manage:
- Company info (name, contact details, slogan)
- Products, Solutions, Packages, Insights, Projects, Services
- Activity dashboard (page views, WhatsApp clicks, form submissions)
