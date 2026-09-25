# Requirements Document

## Introduction

Seven Zillions currently stores all site content in a single TypeScript file (`src/data/site.ts`). There is no backend, database, or authentication system. The admin panel feature introduces a protected, browser-based management interface that allows the business owner to monitor visitor engagement and manage all site content — company details, products, solutions, packages, projects, insights (blog articles), and services — without touching source code. Authentication gates access to the panel. All content mutations persist via a lightweight server-side API layer, which writes through to durable storage (KV or D1 on Cloudflare Workers). The public-facing site continues to read content at request time from the same storage layer.

---

## Glossary

- **Admin**: The authenticated business owner or authorised user of the admin panel.
- **Admin_Panel**: The protected web interface at `/admin` and its sub-routes, accessible only after authentication.
- **Auth_Service**: The server-side module responsible for verifying credentials, issuing session tokens, and enforcing authentication on protected routes.
- **Content_API**: The server-side API handlers (TanStack Start server functions / API routes) that read and write content to durable storage.
- **Content_Store**: Durable storage (Cloudflare KV or D1) that holds all site content and is the source of truth for both the public site and the Admin_Panel.
- **Session**: A short-lived, server-set HTTP-only cookie that identifies an authenticated Admin after login.
- **Activity_Log**: A server-side record of visitor interactions — page views, enquiry form submissions, WhatsApp click events, and contact form submissions.
- **Product**: A content item with fields: `slug`, `name`, `category`, `summary`, `detail`, `detail2`, `highlights`, `specs`, `whatsappMessage`, `image`.
- **Solution**: A content item with fields: `slug`, `name`, `image`, `eyebrow`, `summary`, `detail`, `capacity`, `process`, `equipment`, `specs`.
- **Package**: A content item with fields: `slug`, `name`, `summary`, `includes`, `specs`. Prices are not stored or displayed anywhere.
- **Project**: A portfolio item with fields: `date`, `title`, `copy`, `image`.
- **Insight**: A blog article with fields: `num`, `slug`, `title`, `copy`, `body`.
- **Company_Info**: The top-level company object with fields: `name`, `tagline`, `slogan`, `email`, `address`, `city`, `phones`, `whatsapp`, `whatsappHref`, `promise`, `founded`.
- **Slug**: A URL-safe, lowercase, hyphen-separated string that uniquely identifies a content item within its collection.
- **Spec_Entry**: A key-value pair `{ label: string; value: string }` used in product, solution, and package specifications.

---

## Requirements

### Requirement 1: Authentication

**User Story:** As an Admin, I want to log in with a username and password, so that the admin panel is protected from unauthorised access.

#### Acceptance Criteria

1. THE Admin_Panel SHALL restrict all routes under `/admin` to authenticated sessions; unauthenticated requests SHALL be redirected to `/admin/login`.
2. WHEN an Admin submits valid credentials on the login form, THE Auth_Service SHALL issue a Session cookie and redirect the Admin to `/admin/dashboard`.
3. WHEN an Admin submits invalid credentials, THE Auth_Service SHALL reject the request and display an error message without disclosing which field is incorrect.
4. THE Auth_Service SHALL store the Session in an HTTP-only, `Secure`, `SameSite=Strict` cookie with a maximum age of 8 hours.
5. WHEN an Admin clicks the logout action, THE Auth_Service SHALL invalidate the Session and redirect to `/admin/login`.
6. IF a Session cookie is present but expired or tampered with, THEN THE Auth_Service SHALL reject it and redirect to `/admin/login`.
7. THE Auth_Service SHALL rate-limit login attempts to a maximum of 10 requests per IP address per 15-minute window; subsequent attempts within the window SHALL receive an HTTP 429 response.

---

### Requirement 2: Dashboard and Activity Monitoring

**User Story:** As an Admin, I want a dashboard that shows recent site activity, so that I can monitor visitor engagement without leaving the admin panel.

#### Acceptance Criteria

1. WHEN an Admin navigates to `/admin/dashboard`, THE Admin_Panel SHALL display a summary of the following activity metrics: total page views (last 30 days), enquiry form submissions (last 30 days), WhatsApp click events (last 30 days), and contact form submissions (last 30 days).
2. THE Admin_Panel SHALL display the 10 most recent Activity_Log entries in a chronological list, showing event type, page or product name, and timestamp.
3. WHEN the public site receives a page view, THE Content_API SHALL record an Activity_Log entry with the event type `page_view`, the page path, and the UTC timestamp.
4. WHEN a visitor clicks a WhatsApp link on the public site, THE Content_API SHALL record an Activity_Log entry with the event type `whatsapp_click`, the associated product slug or page, and the UTC timestamp.
5. WHEN a visitor submits the contact form, THE Content_API SHALL record an Activity_Log entry with the event type `contact_submission` and the UTC timestamp.
6. WHEN a visitor submits an enquiry for a product, THE Content_API SHALL record an Activity_Log entry with the event type `enquiry_submission`, the product slug, and the UTC timestamp.
7. IF the Content_Store is unavailable when recording an Activity_Log entry, THEN THE Content_API SHALL log the error server-side and return a successful response to the visitor so that the user experience is not interrupted.

---

### Requirement 3: Company Information Management

**User Story:** As an Admin, I want to edit the company details displayed across the site, so that I can keep contact information and brand copy up to date.

#### Acceptance Criteria

1. WHEN an Admin navigates to `/admin/company`, THE Admin_Panel SHALL display a form pre-populated with the current Company_Info fields: `name`, `tagline`, `slogan`, `email`, `address`, `city`, `phones` (list), `whatsapp`, `whatsappHref`, `promise`, and `founded`.
2. WHEN an Admin submits the company form with valid data, THE Content_API SHALL persist the updated Company_Info to the Content_Store and display a success confirmation.
3. IF the Admin submits the company form with an empty `name`, `email`, or `whatsappHref` field, THEN THE Admin_Panel SHALL prevent submission and display a field-level validation error for each empty required field.
4. IF the Admin submits an `email` value that is not a valid RFC 5322 email address, THEN THE Admin_Panel SHALL prevent submission and display a validation error on the `email` field.
5. WHEN Company_Info is updated, THE public site SHALL serve the updated data on the very next HTTP request to any page that displays company information, with no caching layer permitted between the Content_Store and the response.

---

### Requirement 4: Product Management

**User Story:** As an Admin, I want to add, edit, and delete products with all their fields, so that the products catalogue on the public site reflects current offerings.

#### Acceptance Criteria

1. WHEN an Admin navigates to `/admin/products`, THE Admin_Panel SHALL display a list of all Products with their `name`, `category`, and `slug`.
2. WHEN an Admin clicks the add-product action, THE Admin_Panel SHALL display a form for all Product fields: `slug`, `name`, `category`, `summary`, `detail`, `detail2`, `highlights` (ordered list), `specs` (ordered list of Spec_Entry items), `whatsappMessage`, and `image`.
3. WHEN an Admin submits the add-product form with valid data, THE Content_API SHALL add the Product to the Content_Store and display a success confirmation.
4. WHEN an Admin clicks the edit action for an existing Product, THE Admin_Panel SHALL display the product form pre-populated with the current values for all Product fields.
5. WHEN an Admin submits the edit-product form with valid data, THE Content_API SHALL update the Product in the Content_Store and display a success confirmation.
6. WHEN an Admin clicks the delete action for a Product and confirms the deletion, THE Content_API SHALL remove the Product from the Content_Store and display a success confirmation.
7. IF the Admin submits a product form with an empty `slug`, `name`, `category`, or `summary` field, THEN THE Admin_Panel SHALL prevent submission and display a field-level validation error for each empty required field.
8. IF the Admin enters a `slug` that is already used by another Product, THEN THE Admin_Panel SHALL prevent submission and display a duplicate-slug validation error.
9. THE Admin_Panel SHALL allow the Admin to add, reorder, and remove individual items in the `highlights` and `specs` lists within the product form.
10. WHEN a Product is added, edited, or deleted, THE public site SHALL reflect the change on the very next HTTP request to `/products` or `/products/$slug`, with no caching layer permitted between the Content_Store and the response.

---

### Requirement 5: Solution Management

**User Story:** As an Admin, I want to add, edit, and delete solutions, so that the solutions catalogue on the public site stays current.

#### Acceptance Criteria

1. WHEN an Admin navigates to `/admin/solutions`, THE Admin_Panel SHALL display a list of all Solutions with their `name`, `eyebrow`, and `slug`.
2. WHEN an Admin clicks the add-solution action, THE Admin_Panel SHALL display a form for all Solution fields: `slug`, `name`, `image`, `eyebrow`, `summary`, `detail`, `capacity`, `process` (ordered list of `{ title, copy }` items), `equipment` (ordered list of strings), and `specs` (ordered list of Spec_Entry items).
3. WHEN an Admin submits the add-solution form with valid data, THE Content_API SHALL add the Solution to the Content_Store and display a success confirmation.
4. WHEN an Admin clicks the edit action for an existing Solution, THE Admin_Panel SHALL display the solution form pre-populated with the current values for all Solution fields.
5. WHEN an Admin submits the edit-solution form with valid data, THE Content_API SHALL update the Solution in the Content_Store and display a success confirmation.
6. WHEN an Admin clicks the delete action for a Solution and confirms the deletion, THE Content_API SHALL remove the Solution from the Content_Store and display a success confirmation.
7. IF the Admin submits a solution form with an empty `slug`, `name`, or `summary` field, THEN THE Admin_Panel SHALL prevent submission and display a field-level validation error for each empty required field.
8. IF the Admin enters a `slug` that is already used by another Solution, THEN THE Admin_Panel SHALL prevent submission and display a duplicate-slug validation error.
9. THE Admin_Panel SHALL allow the Admin to add, reorder, and remove individual items in the `process`, `equipment`, and `specs` lists within the solution form.

---

### Requirement 6: Package Management

**User Story:** As an Admin, I want to add, edit, and delete packages, so that the packages section on the public site shows accurate scope.

#### Acceptance Criteria

1. WHEN an Admin navigates to `/admin/packages`, THE Admin_Panel SHALL display a list of all Packages with their `name` and `slug`.
2. WHEN an Admin clicks the add-package action, THE Admin_Panel SHALL display a form for all Package fields: `slug`, `name`, `summary`, `includes` (ordered list of strings), and `specs` (ordered list of Spec_Entry items).
3. WHEN an Admin submits the add-package form with valid data, THE Content_API SHALL add the Package to the Content_Store and display a success confirmation.
4. WHEN an Admin clicks the edit action for an existing Package, THE Admin_Panel SHALL display the package form pre-populated with the current values for all Package fields.
5. WHEN an Admin submits the edit-package form with valid data, THE Content_API SHALL update the Package in the Content_Store and display a success confirmation.
6. WHEN an Admin clicks the delete action for a Package and confirms the deletion, THE Content_API SHALL remove the Package from the Content_Store and display a success confirmation.
7. IF the Admin submits a package form with an empty `slug` or `name` field, THEN THE Admin_Panel SHALL prevent submission and display a field-level validation error for each empty required field.
8. IF the Admin enters a `slug` that is already used by another Package, THEN THE Admin_Panel SHALL prevent submission and display a duplicate-slug validation error.
9. THE Admin_Panel SHALL allow the Admin to add, reorder, and remove individual items in the `includes` and `specs` lists within the package form.

---

### Requirement 7: Project Management

**User Story:** As an Admin, I want to add, edit, and delete portfolio projects, so that the projects section of the site showcases current work.

#### Acceptance Criteria

1. WHEN an Admin navigates to `/admin/projects`, THE Admin_Panel SHALL display a list of all Projects with their `title` and `date`.
2. WHEN an Admin clicks the add-project action, THE Admin_Panel SHALL display a form for all Project fields: `date`, `title`, `copy`, and `image`.
3. WHEN an Admin submits the add-project form with valid data, THE Content_API SHALL add the Project to the Content_Store and display a success confirmation.
4. WHEN an Admin clicks the edit action for an existing Project, THE Admin_Panel SHALL display the project form pre-populated with the current values for all Project fields.
5. WHEN an Admin submits the edit-project form with valid data, THE Content_API SHALL update the Project in the Content_Store and display a success confirmation.
6. WHEN an Admin clicks the delete action for a Project and confirms the deletion, THE Content_API SHALL remove the Project from the Content_Store and display a success confirmation.
7. IF the Admin submits a project form with an empty `title` or `copy` field, THEN THE Admin_Panel SHALL prevent submission and display a field-level validation error for each empty required field.
8. IF the Admin submits a `date` value that is not a valid ISO 8601 date string (YYYY-MM-DD), THEN THE Admin_Panel SHALL prevent submission and display a validation error on the `date` field.

---

### Requirement 8: Insight (Blog Article) Management

**User Story:** As an Admin, I want to add, edit, and delete blog articles (insights), so that the knowledge centre on the public site stays current and relevant.

#### Acceptance Criteria

1. WHEN an Admin navigates to `/admin/insights`, THE Admin_Panel SHALL display a list of all Insights with their `title`, `num`, and `slug`.
2. WHEN an Admin clicks the add-insight action, THE Admin_Panel SHALL display a form for all Insight fields: `num`, `slug`, `title`, `copy`, and `body` (ordered list of paragraph strings).
3. WHEN an Admin submits the add-insight form with valid data, THE Content_API SHALL add the Insight to the Content_Store and display a success confirmation.
4. WHEN an Admin clicks the edit action for an existing Insight, THE Admin_Panel SHALL display the insight form pre-populated with the current values for all Insight fields.
5. WHEN an Admin submits the edit-insight form with valid data, THE Content_API SHALL update the Insight in the Content_Store and display a success confirmation.
6. WHEN an Admin clicks the delete action for an Insight and confirms the deletion, THE Content_API SHALL remove the Insight from the Content_Store and display a success confirmation.
7. IF the Admin submits an insight form with an empty `slug`, `title`, or `copy` field, THEN THE Admin_Panel SHALL prevent submission and display a field-level validation error for each empty required field.
8. IF the Admin enters a `slug` that is already used by another Insight, THEN THE Admin_Panel SHALL prevent submission and display a duplicate-slug validation error.
9. THE Admin_Panel SHALL allow the Admin to add, reorder, and remove individual paragraph strings in the `body` list within the insight form.

---

### Requirement 9: Services Management

**User Story:** As an Admin, I want to edit the services listed on the public site, so that the services section accurately reflects what Seven Zillions currently offers.

#### Acceptance Criteria

1. WHEN an Admin navigates to `/admin/services`, THE Admin_Panel SHALL display all current service items, each with a `title` and `copy` field.
2. WHEN an Admin edits a service item and submits the form, THE Content_API SHALL persist the updated services list to the Content_Store and display a success confirmation.
3. THE Admin_Panel SHALL allow the Admin to add a new service item to the list, providing a `title` and `copy`.
4. WHEN an Admin removes a service item and confirms the deletion, THE Content_API SHALL update the services list in the Content_Store and display a success confirmation.
5. IF the Admin submits a service form with an empty `title` or `copy` field, THEN THE Admin_Panel SHALL prevent submission and display a field-level validation error for each empty required field.

---

### Requirement 10: Image Upload

**User Story:** As an Admin, I want to upload images for products, solutions, projects, and other content items, so that I can update visual content without deploying code.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide an image upload control on each content form that requires an image field.
2. WHEN an Admin selects an image file, THE Admin_Panel SHALL validate that the file is a JPEG, PNG, or WebP image and that its size does not exceed 5 MB before uploading.
3. WHEN a valid image file is submitted with a content form, THE Content_API SHALL store the image in Cloudflare R2 object storage and persist the resulting public URL to the Content_Store alongside the content item.
4. IF the uploaded file is not a JPEG, PNG, or WebP image, THEN THE Admin_Panel SHALL reject the file and display a format validation error before any upload occurs.
5. IF the uploaded file exceeds 5 MB, THEN THE Admin_Panel SHALL reject the file and display a size validation error before any upload occurs.
6. WHEN an image is successfully uploaded, THE Admin_Panel SHALL display a preview of the uploaded image in the form.

---

### Requirement 11: Admin Panel Navigation and Layout

**User Story:** As an Admin, I want a consistent navigation structure within the admin panel, so that I can move between sections efficiently.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a persistent sidebar navigation with links to: Dashboard, Company, Products, Solutions, Packages, Projects, Insights, and Services.
2. THE Admin_Panel SHALL highlight the active section in the sidebar navigation.
3. THE Admin_Panel SHALL display the authenticated Admin's identity (e.g., username or email) and a logout action in a visible location on every Admin_Panel page.
4. THE Admin_Panel SHALL be responsive and usable on screens with a minimum width of 768 px.
5. THE Admin_Panel SHALL NOT render the public site header or footer within any admin route; if the public header or footer is present on an admin route, THE Admin_Panel SHALL redirect to `/admin/login` until the layout violation is resolved.
