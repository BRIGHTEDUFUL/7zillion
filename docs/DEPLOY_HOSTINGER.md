# Deploying to Hostinger (Business / Cloud hosting)

Target: **Hostinger Business Web Hosting or Cloud hosting** — the hPanel
*Node.js web app* flow (Websites → Add Website). No SSH, no server admin
required. This guide assumes the repo is on GitHub.

## How the pieces fit

| Piece | Where it runs | Notes |
|---|---|---|
| TanStack Start SSR server | Hostinger Node.js web app | Built by Hostinger from source; entry `.output/server/index.mjs` |
| Convex backend (database, auth sessions, file storage) | Convex cloud | Already live at `mild-dachshund-456`; Hostinger only talks to it over HTTPS |
| Static assets (JS/CSS/images) | Served by the Node server | Bundled in `.output/public`; requests proxy through Hostinger to Node |
| Image uploads | Client → Convex storage (presigned URL) | Nothing touches the Hostinger disk |

---

## 1. Push the code to GitHub

Everything must be committed — including `convex/` (schema + functions) and all
`src/` folders. **Never** commit `.env` or `.env.local` (git already ignores
them).

```sh
git add -A
git commit -m "Prepare Hostinger deployment"
git push origin main
```

## 2. Create the Node.js web app in hPanel

1. hPanel → **Websites** → **Add Website** → **Node.js web app**
   - If the domain is already added as another website type, remove that
     website first (download a backup first if it has content).
2. Deployment method: **Import from GitHub** → connect the GitHub account that
   owns the repo → select the repository → branch `main`.
3. Review the deploy settings Hostinger detects and adjust to:

| Field | Value |
|---|---|
| Framework preset | auto-detected (Vite/Nitro/Other) — leave as suggested |
| Branch | `main` |
| Node.js version | **24** (22 also works; 18 is too old for this project) |
| Build command | `npm run build` |
| Package manager | npm (auto-detected from `package-lock.json`) |
| Output directory | *(leave empty — this is a server app)* |
| Entry file | `.output/server/index.mjs` |

4. Click **Deploy**. Hostinger installs dependencies, runs `vite build`, and
   starts the server.

> Alternative without GitHub: zip the project (omit `node_modules/`, `.git/`,
> `.output/`) and choose **Upload your files** instead.

## 3. Set environment variables

hPanel → your Node.js app → **Environment variables** → add each row (or
*Import from .env* with your local `.env`):

| Variable | Value |
|---|---|
| `CONVEX_URL` | `https://mild-dachshund-456.convex.cloud` |
| `CONVEX_DEPLOY_KEY` | deploy key from Convex dashboard → Settings → Deploy key |
| `ADMIN_USERNAME` | admin panel username |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password |
| `NODE_ENV` | `production` |

Notes:

- The server reads real environment variables first (`.env` files are only a
  local fallback), so the panel is the source of truth on Hostinger.
- `PORT` is assigned by Hostinger at runtime — the server listens on
  `process.env.PORT` automatically. Do not hardcode a port.
- After changing any variable, press **Restart** on the app.
- Treat `CONVEX_DEPLOY_KEY` like a database password. Anyone with it can write
  to your Convex data.

## 4. Domain + SSL

- Point the domain (A record → Hostinger nameservers are easiest: use
  Hostinger's nameservers and add the domain in hPanel).
- Hostinger provisions SSL for Node.js apps automatically; if HTTPS is not
  active, enable the free SSL certificate for the domain in hPanel →
  **Domains → SSL**.
- HTTPS matters: the admin session cookie is `Secure`, so the login form only
  works over HTTPS.

---

## 5. Verify the deployment

Open these after the first deploy:

1. `https://yourdomain.com/api/health` → `{"ok":true,"service":"seven-zillions",...}`
2. `https://yourdomain.com/` → home page renders
3. `/products`, `/solutions`, `/projects`, `/services`, `/about`, `/blog`,
   `/contact` → all render
4. `/admin` → redirects to `/admin/login`; log in → dashboard opens
5. In the admin panel, upload an image (e.g. edit a product) — uploads go
   straight to Convex storage
6. Footer → **Admin** link works

---

## 6. Ongoing operations

| Task | How |
|---|---|
| Edit content (products, projects, prices… ) | Admin panel — saved to Convex instantly, no redeploy |
| Ship code changes | `git push` (auto-deploy if connected) or hPanel → **Redeploy** |
| Change Convex functions/schema | `npx convex deploy` locally (needs `CONVEX_DEPLOY_KEY`) |
| Add a YouTube video | Admin → Projects or Products → **Video URL** field → paste any YouTube link |
| View logs | hPanel → app → **Runtime Logs** |
| Restart after env change | hPanel → app → **Restart** |

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| Build green, site not responding | **Runtime Logs** — most often a missing env var (`CONVEX_URL environment variable is not set`) |
| 403 after a redeploy | Stale `public_html/.htaccess` (generated, never hand-edit) → **Redeploy** regenerates it |
| 502 / error page on every request | Check Runtime Logs, then confirm entry file is `.output/server/index.mjs` |
| Env change has no effect | **Restart** the app |
| Admin login always fails | Verify `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` in env vars; hash must be the full `$2b$10$...` string |
| Edits made in File Manager vanished | Files under `hbuilds/` and `public_html` are overwritten on every deploy — change code in GitHub instead |
| Deploy picked wrong Node version | App settings → Node.js version → 24 → redeploy |

---

## 8. Local pre-flight (run before pushing)

```sh
npm run typecheck && npm run lint && npm test && npm run build
```

All four must pass; then commit and push.
