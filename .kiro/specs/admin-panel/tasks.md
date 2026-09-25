# Implementation Plan: Admin Panel

## Overview

Introduces a protected admin management interface into the Seven Zillions TanStack Start / Cloudflare Workers application. The static `src/data/site.ts` data layer is replaced by a live Content_Store (D1), a server-side Auth_Service and Content_API (TanStack Start server functions), and a `/admin` route subtree built as a React SPA shell. Public routes are migrated to read from server functions at request time. Images are stored in R2 via presigned PUT URLs. Activity events are recorded fire-and-forget into D1.

---

## Tasks

- [x] 1. Foundation — types, schemas, storage, and infrastructure config
  - [x] 1.1 Extract shared TypeScript types to `src/types/content.ts`
    - Copy `Product`, `Solution`, `Package`, `Insight`, `Spec` (rename to `SpecEntry`) from `src/data/site.ts`
    - Add `Company`, `Project`, `Service`, `EventType`, `ActivityLogEntry` types as defined in the design
    - Export all types; update any existing imports in `src/data/site.ts` and public route files to import from `src/types/content.ts`
    - _Requirements: 3.1, 4.2, 5.2, 6.2, 7.2, 8.2, 9.1_

  - [x] 1.2 Create Zod validation schemas in `src/lib/schemas.ts`
    - Implement `CompanySchema`, `ProductSchema`, `SolutionSchema`, `PackageSchema`, `ProjectSchema`, `InsightSchema`, `ServiceSchema`, `ActivityEntrySchema`
    - Include `DateStringSchema` (`/^\d{4}-\d{2}-\d{2}$/`) for project dates
    - All required fields must use `.min(1)` or equivalent; `email` field uses `.email()`; `whatsappHref` uses `.url()`
    - Export all schemas
    - _Requirements: 3.3, 3.4, 4.7, 5.7, 6.7, 7.7, 7.8, 8.7, 9.5_

  - [ ]* 1.3 Write property tests for Zod schemas (Properties 5, 6, 11)
    - **Property 5: Required-field validation rejects any form with a blank required field**
    - **Validates: Requirements 3.3, 4.7, 5.7, 6.7, 7.7, 8.7, 9.5**
    - **Property 6: Email field rejects all non-RFC-5322 strings**
    - **Validates: Requirements 3.4**
    - **Property 11: ISO 8601 date validation rejects all non-YYYY-MM-DD strings**
    - **Validates: Requirements 7.8**
    - Use `fast-check` with Vitest; minimum 100 runs per property; tag each test as `Feature: admin-panel, Property {N}: {text}`
    - _Requirements: 3.3, 3.4, 4.7, 5.7, 6.7, 7.7, 7.8, 8.7, 9.5_

  - [x] 1.4 Write D1 migration SQL in `migrations/0001_initial.sql`
    - Create all tables: `company`, `products`, `solutions`, `packages`, `insights`, `projects`, `services`, `activity_log`
    - Add indexes: `idx_activity_timestamp` (timestamp DESC), `idx_activity_type` (event_type)
    - Schema must match the design document exactly
    - _Requirements: 2.3, 3.2, 4.3, 5.3, 6.3, 7.3, 8.3, 9.2_

  - [x] 1.5 Update `wrangler.toml` with D1, KV, and R2 bindings
    - Add `[[d1_databases]]` binding named `DB` pointing to the content database
    - Add `[[kv_namespaces]]` binding named `KV` for sessions and rate-limit counters
    - Add `[[r2_buckets]]` binding named `R2` for image storage
    - _Requirements: 1.4, 2.3, 10.3_

  - [x] 1.6 Implement the `ContentStore` adapter in `src/lib/content-store.ts`
    - Define and export the `ContentStore` interface and `CollectionName` union type exactly as specified in the design
    - Implement `D1ContentStore` class: all methods (`getCompany`, `setCompany`, `listItems`, `getItem`, `putItem`, `deleteItem`, `listProjects`, `putProject`, `deleteProject`, `getServices`, `setServices`, `appendActivity`, `queryActivity`)
    - Export a `getContentStore(env: Env): ContentStore` factory function that returns a `D1ContentStore`
    - Slug-uniqueness check in `putItem`: query for existing slug before insert; throw a typed `DuplicateSlugError` if found
    - _Requirements: 3.2, 4.3, 4.8, 5.3, 5.8, 6.3, 6.8, 7.3, 8.3, 8.8, 9.2_

  - [ ]* 1.7 Write property tests for ContentStore round-trip (Property 3)
    - **Property 3: Content round-trip — write then read returns identical data**
    - **Validates: Requirements 3.2, 4.3, 4.5, 5.3, 5.5, 6.3, 6.5, 7.3, 7.5, 8.3, 8.5, 9.2**
    - Test against an in-memory or local D1 mock; use `fc.record` arbitraries derived from schema shapes for each content type
    - _Requirements: 3.2, 4.3, 5.3, 6.3, 7.3, 8.3, 9.2_

  - [ ]* 1.8 Write property tests for slug uniqueness (Property 4)
    - **Property 4: Slug uniqueness is enforced across each collection independently**
    - **Validates: Requirements 4.8, 5.8, 6.8, 8.8**
    - Generate two items with the same slug in the same collection and assert `DuplicateSlugError` is thrown; verify uniqueness is per-collection (same slug in different collections must not conflict)
    - _Requirements: 4.8, 5.8, 6.8, 8.8_

- [x] 2. Auth_Service — login, logout, session validation, rate limiting
  - [x] 2.1 Implement `src/lib/auth.ts` with `login`, `logout`, `validateSession`, and `checkRateLimit`
    - `login`: hash comparison via `bcryptjs`; on success write `session:{token}` to KV with 8-hour TTL; on failure return `{ success: false, reason: 'invalid_credentials' }`; call `checkRateLimit` before attempting validation and return `{ success: false, reason: 'rate_limited' }` if limit exceeded
    - `logout`: delete `session:{token}` key from KV
    - `validateSession`: KV lookup of `session:{token}`; return `{ valid: true, username }` or `{ valid: false }`
    - `checkRateLimit`: KV key `rl:{ip}:{window}` where `window = Math.floor(Date.now() / (15 * 60 * 1000))`; increment counter; return `false` (i.e. blocked) when counter > 10; set KV TTL to 15 min on first write
    - Credentials read from `env.ADMIN_USERNAME` and `env.ADMIN_PASSWORD_HASH` (Worker secrets)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 2.2 Write unit tests for Auth_Service
    - Test `checkRateLimit`: exactly 10 requests allowed; 11th request blocked; counter resets after window
    - Test `validateSession`: valid token → `{ valid: true }`, missing/unknown token → `{ valid: false }`
    - Test `login` error messages: wrong username, wrong password, both wrong — all return the same generic reason `'invalid_credentials'`
    - _Requirements: 1.3, 1.7_

  - [ ]* 2.3 Write property tests for Auth_Service (Properties 1, 2)
    - **Property 1: Unauthenticated requests to any admin route are redirected**
    - **Validates: Requirements 1.1, 1.6**
    - **Property 2: Invalid credentials never reveal which field is wrong**
    - **Validates: Requirements 1.3**
    - Property 2: use `fc.record({ username: fc.string(), password: fc.string() })` and assert the response reason is always `'invalid_credentials'` (never a field-specific message) for any non-matching pair
    - _Requirements: 1.1, 1.3, 1.6_

- [x] 3. Content_API server functions
  - [x] 3.1 Implement `src/api/auth.ts` — `loginFn` and `logoutFn` server functions
    - `loginFn`: validate input with `z.object({ username, password })`; call `auth.login`; on success set HTTP-only `Secure` `SameSite=Strict` cookie (`admin_session`) with 8-hour max-age; redirect to `/admin/dashboard`; on `invalid_credentials` return error object; on `rate_limited` throw HTTP 429
    - `logoutFn`: call `auth.logout` with cookie value; clear cookie; redirect to `/admin/login`
    - _Requirements: 1.2, 1.4, 1.5, 1.7_

  - [x] 3.2 Implement `src/api/company.ts` — `getCompanyFn` and `updateCompanyFn`
    - `getCompanyFn`: no auth required (used by public routes); read from ContentStore
    - `updateCompanyFn`: require auth; validate with `CompanySchema`; write to ContentStore
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 3.3 Implement `src/api/products.ts` — `listProductsFn`, `upsertProductFn`, `deleteProductFn`
    - `listProductsFn`: no auth required; return all products
    - `upsertProductFn`: require auth; validate with `ProductSchema`; call `store.putItem` (which enforces slug uniqueness); surface `DuplicateSlugError` as `{ success: false, errors: { slug: 'already in use' } }`
    - `deleteProductFn`: require auth; validate `{ slug: z.string() }`; call `store.deleteItem`
    - _Requirements: 4.3, 4.5, 4.6, 4.8, 4.10_

  - [x] 3.4 Implement `src/api/solutions.ts` — `listSolutionsFn`, `upsertSolutionFn`, `deleteSolutionFn`
    - Mirror the product server functions pattern; use `SolutionSchema`; enforce slug uniqueness
    - _Requirements: 5.3, 5.5, 5.6, 5.8_

  - [x] 3.5 Implement `src/api/packages.ts` — `listPackagesFn`, `upsertPackageFn`, `deletePackageFn`
    - Mirror the product server functions pattern; use `PackageSchema`; enforce slug uniqueness
    - _Requirements: 6.3, 6.5, 6.6, 6.8_

  - [x] 3.6 Implement `src/api/projects.ts` — `listProjectsFn`, `upsertProjectFn`, `deleteProjectFn`
    - `upsertProjectFn`: on create (no `id`), assign `id = crypto.randomUUID()` before writing; use `ProjectSchema`
    - `deleteProjectFn`: validate `{ id: z.string() }` and call `store.deleteProject`
    - _Requirements: 7.3, 7.5, 7.6_

  - [x] 3.7 Implement `src/api/insights.ts` — `listInsightsFn`, `upsertInsightFn`, `deleteInsightFn`
    - Mirror the product server functions pattern; use `InsightSchema`; enforce slug uniqueness
    - _Requirements: 8.3, 8.5, 8.6, 8.8_

  - [x] 3.8 Implement `src/api/services.ts` — `getServicesFn` and `updateServicesFn`
    - `getServicesFn`: no auth required; read from ContentStore
    - `updateServicesFn`: require auth; validate with `z.array(ServiceSchema)`; write full list to ContentStore
    - _Requirements: 9.2, 9.4_

  - [x] 3.9 Implement `src/api/activity.ts` — `recordActivityFn` and `queryActivityFn`
    - `recordActivityFn`: no auth required; validate input with `ActivityEntrySchema`; wrap D1 write in try/catch; on error call `console.error(err)` and return `{ ok: true }` (fire-and-forget, never propagate to caller)
    - `queryActivityFn`: require auth; accept `ActivityQueryOptions`; delegate to `store.queryActivity`; return results
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.10 Implement `src/api/upload.ts` — `getUploadUrlFn`
    - Require auth; validate `{ filename: z.string(), contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']) }`; generate an R2 presigned PUT URL; return `{ uploadUrl, publicUrl }`
    - _Requirements: 10.3_

  - [x] 3.11 Add a shared `requireAuth` helper in `src/lib/require-auth.ts`
    - Reads `admin_session` cookie from request context; calls `validateSession`; throws `redirect({ to: '/admin/login' })` if session is invalid
    - Import and call this helper in all server functions that mutate data
    - _Requirements: 1.1, 1.6_

- [x] 4. Checkpoint — server layer complete
  - Ensure all server function files compile without TypeScript errors and all unit/property tests in tasks 1–3 pass. Ask the user if any questions arise before continuing.

- [x] 5. Admin route subtree — TanStack Router file-based routes
  - [x] 5.1 Create `src/routes/admin/__root.tsx` — `AdminShell` layout with auth guard
    - Add `beforeLoad` hook that calls `validateSession`; redirects to `/admin/login` if session is invalid
    - Render `AdminShell` component (sidebar + topbar + `<Outlet />`); must NOT include `<SiteHeader>` or `<SiteFooter>`
    - _Requirements: 1.1, 1.6, 11.1, 11.3, 11.5_

  - [x] 5.2 Create `src/routes/admin/login.tsx` — `/admin/login` page
    - No auth guard; render `LoginPage` component; wire `loginFn` to form submit
    - _Requirements: 1.2, 1.3_

  - [x] 5.3 Create `src/routes/admin/dashboard.tsx` — `/admin/dashboard` page
    - Loader calls `queryActivityFn` for 30-day metrics and last-10 entries; render `ActivityWidget`
    - _Requirements: 2.1, 2.2_

  - [x] 5.4 Create `src/routes/admin/company.tsx` — `/admin/company` page
    - Loader calls `getCompanyFn`; render `ContentForm` pre-populated with current Company data; submit calls `updateCompanyFn`
    - _Requirements: 3.1, 3.2_

  - [x] 5.5 Create products sub-routes: `src/routes/admin/products/index.tsx`, `new.tsx`, `$slug.tsx`
    - `index.tsx` loader calls `listProductsFn`; renders `ContentList` with name, category, slug columns; links to `new` and `$slug` routes
    - `new.tsx` renders blank `ContentForm`; submit calls `upsertProductFn`
    - `$slug.tsx` loader calls server function to get single product; renders pre-populated `ContentForm`; submit calls `upsertProductFn`; delete button calls `deleteProductFn` after `ConfirmDialog`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.6 Create solutions sub-routes: `src/routes/admin/solutions/index.tsx`, `new.tsx`, `$slug.tsx`
    - Same pattern as products; columns: name, eyebrow, slug
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 5.7 Create packages sub-routes: `src/routes/admin/packages/index.tsx`, `new.tsx`, `$slug.tsx`
    - Same pattern as products; columns: name, slug
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 5.8 Create projects sub-routes: `src/routes/admin/projects/index.tsx`, `new.tsx`, `$id.tsx`
    - Columns: title, date; keyed by `id` (UUID) not slug
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 5.9 Create insights sub-routes: `src/routes/admin/insights/index.tsx`, `new.tsx`, `$slug.tsx`
    - Columns: title, num, slug
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 5.10 Create `src/routes/admin/services/index.tsx` — `/admin/services` page
    - Loader calls `getServicesFn`; renders full editable list of `{ title, copy }` items; submit calls `updateServicesFn` with entire updated list
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 6. Admin Shell UI components
  - [x] 6.1 Implement `src/components/admin/AdminShell.tsx`, `AdminSidebar.tsx`, `AdminTopBar.tsx`
    - `AdminSidebar`: navigation links to Dashboard, Company, Products, Solutions, Packages, Projects, Insights, Services; highlight active route using TanStack Router's `useMatch` or active-link class
    - `AdminTopBar`: display authenticated username (from session); logout button calls `logoutFn`
    - `AdminShell`: responsive layout — sidebar visible at ≥ 768 px; sidebar collapses to hamburger menu on narrower viewports
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 6.2 Implement `src/components/admin/ContentList.tsx`
    - Generic sortable table component; accepts `columns` (header + accessor) and `items` array props
    - Each row renders an Edit link and a Delete button that opens `ConfirmDialog`
    - _Requirements: 4.1, 5.1, 6.1, 7.1, 8.1_

  - [x] 6.3 Implement `src/components/admin/DynamicList.tsx` and `SpecEntryList.tsx`
    - `DynamicList`: reorderable list of strings; supports add, remove, and drag-to-reorder (or up/down buttons); renders inline text inputs for each item
    - `SpecEntryList`: specialised `DynamicList` variant for `{ label: string; value: string }` pairs; renders two inputs per row
    - _Requirements: 4.9, 5.9, 6.9, 8.9_

  - [x] 6.4 Implement `src/components/admin/ImageUpload.tsx`
    - File input that validates MIME type ∈ `{image/jpeg, image/png, image/webp}` and size ≤ 5 MB before any network call; show format/size error if invalid
    - On valid file: call `getUploadUrlFn`; PUT file bytes directly to returned `uploadUrl`; on success set form field to `publicUrl` and render image preview
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 6.5 Write property tests for ImageUpload validation (Property 9)
    - **Property 9: Image upload rejects any file outside the allowed type or size envelope**
    - **Validates: Requirements 10.2, 10.4, 10.5**
    - Use `fc.oneof` to generate invalid MIME strings and `fc.integer` for sizes > 5 MB; assert no network call is made and an error message is displayed
    - _Requirements: 10.2, 10.4, 10.5_

  - [x] 6.6 Implement `src/components/admin/ContentForm.tsx`
    - Generic form wrapper; accepts a Zod schema for client-side validation; displays field-level errors inline on invalid submit; submit/cancel/delete button set; calls appropriate server function on submit
    - _Requirements: 3.3, 4.7, 5.7, 6.7, 7.7, 8.7, 9.5_

  - [x] 6.7 Implement `src/components/admin/ConfirmDialog.tsx`
    - Wraps Radix UI `AlertDialog`; accepts `title`, `description`, and `onConfirm` callback; renders a cancel and a confirm button
    - _Requirements: 4.6, 5.6, 6.6, 7.6, 8.6, 9.4_

  - [x] 6.8 Implement `src/components/admin/ActivityWidget.tsx`
    - Metric cards: total page views, enquiry submissions, WhatsApp clicks, contact submissions — all filtered to last 30 days
    - Recent activity table: 10 most recent entries with event type, path/slug, and formatted timestamp columns
    - _Requirements: 2.1, 2.2_

- [x] 7. Checkpoint — admin UI complete
  - Ensure all admin route files and UI components compile, the sidebar navigation renders correctly, and the auth guard redirects unauthenticated users. Ask the user if any questions arise before continuing.

- [x] 8. Admin pages — connect forms to server functions
  - [x] 8.1 Wire login page: display validation error from `loginFn` response below the form; no field-specific hint (same generic message for all failure cases)
    - _Requirements: 1.2, 1.3_

  - [x] 8.2 Wire company page: client-side `CompanySchema` validation in `ContentForm`; on Zod failure show field errors; on server success show success toast; on server error show generic error toast
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 8.3 Wire products pages: `ContentForm` uses `ProductSchema`; `DynamicList` for `highlights`; `SpecEntryList` for `specs`; `ImageUpload` for `image`; duplicate-slug error from server surfaces on `slug` field
    - _Requirements: 4.3, 4.5, 4.7, 4.8, 4.9_

  - [x] 8.4 Wire solutions pages: `ContentForm` uses `SolutionSchema`; `DynamicList` for `process` items (two sub-fields each), `equipment`, and `specs`; `ImageUpload` for `image`
    - _Requirements: 5.3, 5.5, 5.7, 5.8, 5.9_

  - [x] 8.5 Wire packages pages: `ContentForm` uses `PackageSchema`; `DynamicList` for `includes`; `SpecEntryList` for `specs`
    - _Requirements: 6.3, 6.5, 6.7, 6.8, 6.9_

  - [x] 8.6 Wire projects pages: `ContentForm` uses `ProjectSchema`; ISO date validation on `date` field; `ImageUpload` for `image`
    - _Requirements: 7.3, 7.5, 7.7, 7.8_

  - [x] 8.7 Wire insights pages: `ContentForm` uses `InsightSchema`; `DynamicList` for `body` paragraphs; duplicate-slug error from server surfaces on `slug` field
    - _Requirements: 8.3, 8.5, 8.7, 8.8, 8.9_

  - [x] 8.8 Wire services page: inline editable list of `{ title, copy }` items; add/remove item buttons; submit calls `updateServicesFn` with full updated array; field-level errors on empty `title` or `copy`
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 9. Public route migration — replace static imports with server functions
  - [x] 9.1 Update `src/routes/index.tsx` (home page) loader to call `getCompanyFn` and any other data it reads from `src/data/site.ts`
    - Remove the static import; call the appropriate server function(s) in the `loader`
    - _Requirements: 3.5_

  - [x] 9.2 Update `src/routes/products/index.tsx` and `src/routes/products/$slug.tsx` loaders to call `listProductsFn` / `getProductFn`
    - _Requirements: 4.10_

  - [x] 9.3 Update `src/routes/solutions/` loaders to call `listSolutionsFn` / `getSolutionFn`
    - _Requirements: 5.5 (no-cache guarantee)_

  - [x] 9.4 Update `src/routes/packages/` loaders to call `listPackagesFn` / `getPackageFn`
    - _Requirements: 6.5 (no-cache guarantee)_

  - [x] 9.5 Update `src/routes/projects/` loaders to call `listProjectsFn`
    - _Requirements: 7.5 (no-cache guarantee)_

  - [x] 9.6 Update `src/routes/blog/` (insights) loaders to call `listInsightsFn` / `getInsightFn`
    - _Requirements: 8.5 (no-cache guarantee)_

  - [x] 9.7 Update `src/routes/services/` loaders to call `getServicesFn`
    - _Requirements: 9.2 (no-cache guarantee)_

  - [x] 9.8 Update `src/routes/contact.tsx` and any route that reads `company` data to call `getCompanyFn`
    - _Requirements: 3.5_

  - [ ]* 9.9 Write property tests for no-cache data reading (Property 10)
    - **Property 10: Public pages reflect Content_Store state on the very next request**
    - **Validates: Requirements 3.5, 4.10**
    - Use the in-memory ContentStore mock: write an item, then call the corresponding loader directly and assert the returned data matches the written item (no stale data)
    - _Requirements: 3.5, 4.10_

- [x] 10. Activity recording — wire events in public routes
  - [x] 10.1 Add `recordActivityFn` call to all public page loaders for `page_view` events
    - Include the route path in the `path` field; timestamp as `new Date().toISOString()`; call is fire-and-forget (do not await or surface errors)
    - _Requirements: 2.3_

  - [x] 10.2 Add `whatsapp_click` recording: find the WhatsApp link handler(s) in the public site and call `recordActivityFn` with event type `whatsapp_click`, the product slug or page context, and UTC timestamp
    - _Requirements: 2.4_

  - [x] 10.3 Add `contact_submission` recording: in the contact form submit handler, call `recordActivityFn` with event type `contact_submission` and UTC timestamp
    - _Requirements: 2.5_

  - [x] 10.4 Add `enquiry_submission` recording: in the enquiry/product-enquiry form submit handler, call `recordActivityFn` with event type `enquiry_submission`, the product `slug`, and UTC timestamp
    - _Requirements: 2.6_

  - [ ]* 10.5 Write property tests for activity log (Properties 7, 8)
    - **Property 7: Activity log entries faithfully record their inputs**
    - **Validates: Requirements 2.3, 2.4, 2.6**
    - **Property 8: Dashboard "recent 10" shows the newest entries and no others**
    - **Validates: Requirements 2.2**
    - Property 7: generate arbitrary `{ eventType, path, slug, timestamp }` inputs, call `appendActivity`, query back, and assert exact field match
    - Property 8: generate lists of N ≥ 1 entries with distinct timestamps; call `queryActivity({ limit: 10 })`; assert count = min(N,10) and all returned entries have timestamps ≥ the 10th-most-recent
    - _Requirements: 2.2, 2.3, 2.4, 2.6_

- [x] 11. Data seeding — migrate `src/data/site.ts` into D1
  - [x] 11.1 Create `scripts/seed.ts` migration script
    - Read all content from `src/data/site.ts` (products, solutions, packages, projects, insights, services, company)
    - Use the `ContentStore` adapter to write each item into D1 via `wrangler d1 execute` or a local `wrangler dev` connection
    - For projects: assign `id = crypto.randomUUID()` for each existing project record
    - Script should be idempotent (upsert, not insert-only)
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_

- [ ] 12. Final checkpoint — end-to-end validation
  - Ensure all tests pass (unit, property-based, integration). Verify: `/admin` redirects to `/admin/login` without a session; login with correct credentials issues cookie and redirects to dashboard; creating a product via the admin form causes it to appear on `/products` on the next request; activity events are recorded in D1. Ask the user if any questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP iteration.
- Each task references specific requirements for traceability; requirement numbering matches `requirements.md` (e.g., `4.8` = Requirement 4, Acceptance Criterion 8).
- Property-based tests use `fast-check` with Vitest and must be tagged `Feature: admin-panel, Property {N}: {text}` for traceability to `design.md`.
- `src/data/site.ts` is **not deleted** — it is retained as the source for the seed script (task 11.1) and can be removed only after seeding is confirmed.
- All admin server functions that mutate data must call `requireAuth` (task 3.11) before any store operation.
- The `ContentForm` component should use React Hook Form (or equivalent) bound to the relevant Zod schema for client-side validation; this avoids duplicating validation logic.
- R2 presigned URL generation differs between `wrangler dev` (local) and the deployed Worker; test the upload flow against both environments before marking task 6.4 complete.
- Minimum viewport for admin UI is 768 px (Requirement 11.4); use Tailwind's `md:` breakpoint as the collapse point for the sidebar.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.4", "1.5"] },
    { "id": 1, "tasks": ["1.2", "1.6"] },
    { "id": 2, "tasks": ["1.3", "1.7", "1.8", "2.1", "3.11"] },
    {
      "id": 3,
      "tasks": ["2.2", "2.3", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10"]
    },
    { "id": 4, "tasks": ["5.1", "5.2", "6.1", "6.2", "6.3", "6.7"] },
    {
      "id": 5,
      "tasks": ["5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "6.4", "6.6", "6.8"]
    },
    { "id": 6, "tasks": ["6.5", "8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8"] },
    { "id": 8, "tasks": ["9.9", "10.1", "10.2", "10.3", "10.4"] },
    { "id": 9, "tasks": ["10.5", "11.1"] }
  ]
}
```
