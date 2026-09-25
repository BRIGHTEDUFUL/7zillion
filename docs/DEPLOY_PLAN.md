# Hostinger Deployment Plan — Seven Zillions

Execution plan for shipping the site to Hostinger. The general reference guide
stays in `docs/DEPLOY_HOSTINGER.md`; this file is the sequenced, verified plan
for the current round.

|                 |                                                                                         |
| --------------- | --------------------------------------------------------------------------------------- |
| **Target**      | Hostinger **Web Apps Hosting** — hPanel → _Websites_ → _Add Website_ → _Deploy Web App_ |
| **Repo**        | `BRIGHTEDUFUL/7zillion` (public), branch `main`                                         |
| **Domain**      | **Temporary domain for now.** `sevenzillions.com` stays untouched on Namecheap          |
| **Ship method** | GitHub integration — auto-deploy on push to `main`                                      |
| **Prepared**    | 2026-09-25                                                                              |

---

## Decisions (locked)

| Decision      | Choice                                         | Why                                                                                     |
| ------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Hosting plan  | Web Apps Hosting (hPanel Node.js web app)      | Chosen target; supports Node 18/20/22/24 and GitHub auto-deploy                         |
| Domain        | Temporary domain first                         | Live domain has a WordPress site + Namecheap DNS + MX; no risk to either during staging |
| Live domain   | **No change this round**                       | Namecheap NS (`dns1/dns2.namecheaphosting.com`), A → `198.54.116.131`, MX intact        |
| Code shipping | GitHub auto-deploy on push                     | Chosen; matches the reference guide                                                     |
| Backend       | Convex cloud (`mild-dachshund-456`) over HTTPS | Hostinger stores no data; image uploads go straight to Convex storage                   |

---

## Deploy attempt #1 — failed (2026-09-25 09:53) and what changed

Build log ended with `Cannot find package '@vitejs/plugin-react'` and
`Cannot find package 'nitro'` while loading `vite.config.ts`. Two separate
causes:

| #   | Observed                                                                                                     | Cause                                                                                                                                                     | Fix                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | `npm warn EBADENGINE ... current: { node: 'v20.19.4' }` — `@tanstack/react-start@1.168.32` wants `>=22.12.0` | Node.js version was left on **20** in hPanel                                                                                                              | Set Node.js version to **24** (Stage 1) — **required**, not optional                                                      |
| 2   | `added 271 packages` (lockfile has 506), only DEV-only imports failed                                        | Install ran with `NODE_ENV=production`, so npm **omitted `devDependencies`**. `vite` survived only because it is reachable through a production peer edge | Moved `@vitejs/plugin-react`, `nitro`, `vite` from `devDependencies` → `dependencies` and regenerated `package-lock.json` |

Why those exact two packages: everything else `vite.config.ts` imports was
already in `dependencies` (`@tailwindcss/vite`, `vite-tsconfig-paths`,
`@tanstack/react-start`, `@tanstack/router-plugin`), and `typescript` was
already production. Only the React JSX plugin and the Nitro bundler were left
in `devDependencies`. `vite.config.ts` runs **during the build on the host**,
so every package it imports must be installed under a production-only install.

Also bumped `engines.node` from `>=20` to `>=22.12.0` so a wrong Node version
now produces an `EBADENGINE` warning naming _this_ package instead of only the
third-party ones.

> The lockfile **must** be committed alongside `package.json` — Hostinger runs
> `npm ci`, which hard-fails if they are out of sync.

---

## Stage 0 — Pre-flight (verified 2026-09-25)

| Check                   | Result                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`     | ✅ 0 errors                                                                                              |
| `npm run lint`          | ✅ 0 errors (6 known `react-refresh/only-export-components` warnings in `src/components/ui/*`)           |
| `npm test`              | ✅ 70/70 passed                                                                                          |
| `npm run build`         | ✅ client + SSR + Nitro `node-server` → `.output/`                                                       |
| Built server smoke test | ✅ `/api/health` 200, `/` 200 (69 kB), `/products` 200, `/admin` 200, zero stderr                        |
| GitHub                  | ✅ `main` == `origin/main`, working tree clean, HEAD `b0d8ee7`                                           |
| Convex deployment       | ✅ `npx convex function-spec` returns **36 functions — exact match** to `convex/{auth,content,files}.ts` |
| Secrets in git          | ✅ `.env` / `.env.local` git-ignored; only `.env.example` is tracked                                     |
| Domain-agnostic URLs    | ✅ canonical + `og:url` emit relative `/`; no hardcoded base URL                                         |
| Repo visibility         | ✅ Public → Hostinger can import it directly                                                             |

> Hostinger builds from source on its own Linux machines, so the local
> Windows build artefacts (`.output/`, `dist/`) are irrelevant — both are
> git-ignored and regenerated on their side.
>
> **Update:** attempt #1 on Hostinger failed for two environment reasons
> (Node 20 instead of 24; dev deps omitted). See _Deploy attempt #1_ above —
> the `package.json` fix is committed and pushed with this plan.

---

## Stage 1 — Create the web app

1. hPanel → **Websites** → **Add Website** → **Deploy Web App** → **Import Git Repository**.
2. Authorize GitHub, then select **`BRIGHTEDUFUL/7zillion`**, branch **`main`**.
3. Review the auto-detected build settings and correct them to:

   | Field            | Value                      | Note                                                                                                                                                                                                              |
   | ---------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Framework preset | **Other**                  | ⚠️ Hostinger will likely auto-detect **Vite** and treat this as a _front-end (static)_ app, which would never start the SSR server. Force **Other** so an entry file is accepted.                                 |
   | Branch           | `main`                     |                                                                                                                                                                                                                   |
   | Node.js version  | **24**                     | ⚠️ **Hard requirement.** Attempt #1 ran on the default **20.19.4** and emitted `EBADENGINE` for every `@tanstack/react-start*` package (`required: >=22.12.0`). 22 also works; 18 does not (`engines: >=22.12.0`) |
   | Package manager  | npm                        | auto-detected from `package-lock.json`                                                                                                                                                                            |
   | Build command    | `npm run build`            | available in the Build settings dropdown                                                                                                                                                                          |
   | Entry file       | `.output/server/index.mjs` | same as `npm start`                                                                                                                                                                                               |
   | Output directory | leave empty                | see the fallback below                                                                                                                                                                                            |
   | Install command  | default (`npm ci`)         |                                                                                                                                                                                                                   |

   **Output directory fallback:** if the form refuses to save without a value,
   enter `.output/public` (the Nitro static bundle). If the site then 404s on
   routes like `/products`, clear it again and rely on Node serving the assets.

4. Click **Deploy**. First build takes a couple of minutes
   (install → `vite build` → start).

### Confirm it started as a _server-side_ app

hPanel → your app dashboard → status shows **Running** _and_ a **Restart**
button. Hostinger only offers _Restart_ for server-side Node.js apps; static
front-end apps do not get it. If there is no Restart button, the app was
created as static — remove the website and re-create it with **Other**.

---

## Stage 2 — Environment variables

hPanel → app → **Environment Variables** → add each row. `.env` and
`.env.local` are git-ignored, so **none of this reaches Hostinger
automatically** — the panel is the only source of truth there.

| Variable              | Value                                     | Source            |
| --------------------- | ----------------------------------------- | ----------------- |
| `CONVEX_URL`          | `https://mild-dachshund-456.convex.cloud` | `.env`            |
| `CONVEX_DEPLOY_KEY`   | deploy key                                | `.env.local`      |
| `ADMIN_USERNAME`      | admin username                            | `.env`            |
| `ADMIN_PASSWORD_HASH` | full bcrypt `$2b$10$...` string           | `.env`            |
| `NODE_ENV`            | `production`                              | set in panel only |

Notes:

- **Do not set `PORT`** — Hostinger assigns it; `src/server.ts` reads
  `process.env.PORT`.
- **Do not set `NODE_ENV` anywhere that touches the build.** Vite loads `.env`
  during `vite build`, and `NODE_ENV=development` there compiles production JSX
  with `jsxDEV`, crashing the server. The panel is runtime-only, so it is safe.
- `CONVEX_SITE_URL` is unused (no `httpAction`s) — skip it.
- After any change: **Restart** the app (or trigger a redeploy).
- Treat `CONVEX_DEPLOY_KEY` like a database password.

---

## Stage 3 — Temporary domain + SSL

1. Hostinger assigns a temporary domain when the app is created — note it from
   the dashboard.
2. Confirm HTTPS works on it (Hostinger provisions SSL automatically; if not,
   hPanel → _Domains → SSL_).
3. `sevenzillions.com` is deliberately **not** touched this round: NS stay at
   Namecheap, A/`www`/MX unchanged, old WordPress stays reachable.

---

## Stage 4 — Verify (on the temporary domain)

1. `https://<temp-domain>/api/health` →
   `{"ok":true,"service":"seven-zillions","time":...}`
2. `/` → home page renders with content (proves Convex is answering).
3. `/products`, `/solutions`, `/projects`, `/services`, `/about`, `/blog`,
   `/contact` → all 200.
4. `/admin` → redirects to `/admin/login`; log in with the env bootstrap
   credentials → dashboard opens.
5. Admin → upload an image (e.g. edit a product) → appears after reload
   (goes to Convex storage, never Hostinger's disk).
6. Admin → **Settings** → confirm password/username change still works.
7. Footer → **Admin** link works.
8. hPanel → **Runtime Logs** → clean (no `CONVEX_URL environment variable is
not set`, no `jsxDEV is not a function`).

---

## Stage 5 — Ship loop

| Task                               | How                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| Ship code                          | `git push origin main` → Hostinger auto-builds and restarts                     |
| Gate before every push             | `npm run typecheck && npm run lint && npm test && npm run build`                |
| Edit content (products, projects…) | Admin panel → Convex, no redeploy                                               |
| Change Convex schema/functions     | `npx convex deploy` locally (needs `CONVEX_DEPLOY_KEY`)                         |
| View logs                          | hPanel → app → **Runtime Logs** / **Deployments**                               |
| Restart after env change           | hPanel → app → **Restart**                                                      |
| Roll back                          | hPanel → _Deployments_ — previous build is kept, `hbuilds/current` is a symlink |

One hosting plan connects to **one** GitHub account; all Node.js sites on the
plan share it.

---

## Stage 6 — Later: cut over to sevenzillions.com

Deferred on purpose. When ready, pick one:

| Option                                                     | Steps                                                                                              | Trade-off                                                        |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **A. Keep Namecheap DNS, repoint A records** (recommended) | Add the domain in hPanel, then at Namecheap set `@` A → Hostinger Node.js IP and `www` → CNAME `@` | Namecheap-hosted email keeps working untouched; no MX migration  |
| **B. Move nameservers to Hostinger**                       | Change NS at Namecheap to Hostinger's, re-add MX in hPanel                                         | Simplest hPanel flow, but **email breaks until MX is recreated** |

Also at cutover:

- Back up the existing WordPress site on Namecheap before retiring it.
- `public/robots.txt` currently allows every crawler — fine for a temp domain
  that nobody has, but consider `Disallow: /` while it is staging.
- `company.site` in `src/data/site.ts` is `www.sevenzillions.com` (footer
  copyright only) — harmless on staging.

---

## Risks & watch-outs

| #   | Risk                                                                                                                | Mitigation                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | **Auto-detect picks "Vite" → static app, SSR never starts**                                                         | Force framework **Other** + entry file; confirm the **Restart** button exists (Stage 1) |
| 2   | **Output directory field** is ambiguous for a Nitro app                                                             | Leave empty; fallback `.output/public`; re-clear if routes 404                          |
| 3   | **Env vars absent** → `CONVEX_URL environment variable is not set`                                                  | Stage 2 table; `.env` files never reach Hostinger                                       |
| 4   | **Node left on the default 20** → `EBADENGINE`, and TanStack Start wants `>=22.12.0`                                | Set **24** in Build settings; `engines` now flags it too                                |
| 5   | **`NODE_ENV=production` reaches `npm ci`** → dev deps omitted → `Cannot find package '@vitejs/plugin-react'`        | Build-only packages now live in `dependencies` (see "Deploy attempt #1")                |
| 6   | **`NODE_ENV=development` reaches `vite build`** → compiles `jsxDEV`, server crashes with `jsxDEV is not a function` | Never put `NODE_ENV` in `.env`; panel value only                                        |
| 7   | **`package-lock.json` out of sync** → `npm ci` hard-fails                                                           | Commit lockfile with every `package.json` change                                        |
| 8   | **403 after redeploy**                                                                                              | Stale `public_html/.htaccess` → **Redeploy** regenerates it                             |
| 9   | **Staging indexable**                                                                                               | Temp domain; optionally add `Disallow: /` to `robots.txt` before cutover                |
| 10  | **Repo carries ~31 MB of non-app files**                                                                            | See optional hygiene below — not a blocker                                              |

### Optional repo hygiene (not required to deploy)

`git ls-files` = 261 files, of which the largest are not part of the app:

| Path                             | Size    |
| -------------------------------- | ------- |
| `clips/*.mp4` (4 files)          | ~31 MB  |
| `assets images/*.jpeg` (7 files) | ~1.9 MB |

These are cloned on **every** Hostinger deploy. Nothing breaks, but builds are
slower than they need to be. To drop them:

```sh
git rm -r --cached "clips" "assets images"
# then add them to .gitignore and commit
```

The images actually used by the site already live in `public/assets/brand/`
and `src/assets/brand/`, so nothing visual changes.

---

## Execution checklist

**To retry attempt #1:**

- [ ] **Fix** — `package.json` + `package-lock.json` updated (build-time deps moved to `dependencies`, `engines` → `>=22.12.0`); commit and push
- [ ] **hPanel** → app → Build settings → Node.js version → **24**
- [ ] **hPanel** → **Redeploy** and confirm the install step now resolves
      `@vitejs/plugin-react` and `nitro`
- [ ] **hPanel** → app → status shows **Running** _and_ a **Restart** button (server-side, not static)

**Then:**

- [ ] **Stage 2** — add the 5 environment variables, Restart
- [ ] **Stage 3** — note temporary domain, confirm HTTPS
- [ ] **Stage 4** — run the 8 verification steps
- [ ] **Stage 5** — push a trivial change, confirm auto-deploy fires
- [ ] **Stage 6** — (later) cut over `sevenzillions.com`
