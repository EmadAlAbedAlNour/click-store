# Click-Store Architecture

## 1. System Overview
Click-Store is a monorepo with:
- `backend/`: Express API server backed by PostgreSQL.
- `frontend/`: React + Vite SPA for storefront and admin.

Runtime flow:
- Browser loads frontend app.
- Frontend calls backend endpoints under `/api/*` with `withCredentials: true`.
- Backend handles auth, business logic, and SQL access through repository/service layers.

## 2. Technology Stack
- Frontend: React 19, React Router 7, Axios, Tailwind CSS, Framer Motion, Vite 7.
- Backend: Node.js ESM, Express 4, `pg`, JWT (`jsonwebtoken`), `bcryptjs`.
- Security middleware: `helmet`, `cors`, `express-rate-limit`.
- Upload handling: `multer` with type and size restrictions.

## 3. Backend Architecture (`backend/src`)

### 3.1 Startup and Boot Flow
1. `server.js` loads `backend/.env`.
2. `server.js` imports `app.js` and DB connection in parallel.
3. `app.js` validates production secret policy (`JWT_SECRET` length/strength).
4. `initializeDatabase` triggers schema application + seeding.
5. Middleware stack is applied (security, parsers, static uploads).
6. Route modules are registered.
7. Error middleware is applied last.
8. `server.js` starts listening unless `NODE_ENV=test`, and handles graceful shutdown (`SIGINT`/`SIGTERM`).

Note:
- Database bootstrap is asynchronous and starts during app initialization.

### 3.2 Database Layer
- `db/connection.js`:
  - Builds PostgreSQL config from `DATABASE_URL` or discrete `PG*` vars.
  - Supports SSL flags via `PG_SSL` and `PG_SSL_REJECT_UNAUTHORIZED`.
  - Accepts `PG_POOL_MAX` input but currently forces actual pool size to `1` to preserve transaction semantics with current repository pattern.
- `db/dbClient.js`:
  - Adapts SQL with `?` placeholders to PostgreSQL `$1..$n`.
  - Auto-appends `RETURNING id` on inserts when absent.
  - Exposes `get`, `all`, `run` helper methods used by repositories.
- `db/schema.js` creates core tables:
  - `settings`, `users`, `customers`, `categories`, `products`, `product_variants`, `product_reviews`,
    `orders`, `coupons`, `pages`, `page_blocks`, `wishlists`, `media`, `activity_logs`.
- `db/seed.js` inserts initial data when tables are empty (admin/settings/demo catalog/pages).

### 3.3 Module Pattern
Each backend domain follows:
- `*.repository.js`: SQL/data access.
- `*.service.js`: business rules and transaction orchestration.
- `*.routes.js`: HTTP handlers, auth gates, validation wiring, response mapping.

### 3.4 Middleware Responsibilities
- `middleware/security.js`
  - Helmet headers.
  - CORS allowlist from env (`CORS_ORIGINS`/`CORS_ORIGIN`).
  - Development-only relaxed origin handling for private/LAN testing.
  - Global rate limiter and dedicated auth rate limiter.
- `middleware/auth.js`
  - Cookie parsing + JWT verification.
  - Staff and customer auth middleware.
  - Role checks (`requireRoles`).
  - Optional legacy bearer fallback controlled by `ENABLE_LEGACY_BEARER_FALLBACK`.
- `middleware/validators.js`
  - Product, order, and settings payload validation.
- `middleware/upload.js`
  - Multer disk storage to `backend/storage/uploads`.
  - Allowed types: JPEG/PNG/WEBP.
  - Max size: 5 MB.
- `middleware/error.js`
  - Final error shaping to `{ error: string }`.

### 3.5 Authentication and Session Model
- Cookie names:
  - Staff: `staff_auth_token`
  - Customer: `customer_auth_token`
- Cookie defaults:
  - `httpOnly`, `sameSite=lax`, `path=/`, `secure` only in production.
- Expiration:
  - Staff session cookie max age: 24h.
  - Customer session cookie max age: 30 days.
- Legacy support:
  - Bearer token auth is still accepted unless `ENABLE_LEGACY_BEARER_FALLBACK=0`.
- Roles used across server:
  - `admin`, `editor`, `cashier`, `customer`.

### 3.6 API Surface
- System
  - `GET /health`, `GET /api/health`
- Staff auth
  - `POST /api/login`
  - `GET /api/auth/me`
  - `POST /api/logout`
- Customers + wishlist
  - `POST /api/customers/register`
  - `POST /api/customers/login`
  - `POST /api/customers/logout`
  - `GET /api/customers/me`
  - `PUT /api/customers/me`
  - `GET /api/customers/orders`
  - `GET /api/customers` (admin)
  - `PUT /api/customers/:id` (admin)
  - `GET /api/customers/:id/orders` (admin)
  - `GET /api/wishlist`
  - `POST /api/wishlist`
  - `DELETE /api/wishlist/:productId`
- Users (staff accounts, admin only)
  - `GET /api/users`
  - `POST /api/users`
  - `PUT /api/users/:id`
  - `DELETE /api/users/:id`
- Products
  - `GET /api/products`
  - `GET /api/products/batch`
  - `GET /api/products/:id`
  - `GET /api/products/:id/reviews`
  - `POST /api/products/:id/reviews`
  - `POST /api/products` (admin/editor)
  - `PUT /api/products/:id` (admin/editor)
  - `DELETE /api/products/:id` (admin/editor)
  - `POST /api/products/bulk` (admin/editor)
- Categories
  - `GET /api/categories`
  - `POST /api/categories` (admin/editor)
  - `PUT /api/categories/:id` (admin/editor)
  - `DELETE /api/categories/:id` (admin/editor)
- Orders
  - `POST /api/orders`
  - `GET /api/orders` (admin/editor/cashier)
  - `PUT /api/orders/:id` (admin/editor/cashier)
  - `PUT /api/orders/bulk` (admin/editor/cashier)
- Pages
  - `GET /api/pages`
  - `GET /api/pages/:slug`
  - `POST /api/pages` (admin)
  - `PUT /api/pages/:id/publish` (admin)
  - `DELETE /api/pages/:slug` (admin)
- Settings
  - `GET /api/settings`
  - `PUT /api/settings` (admin)
- Coupons
  - `GET /api/coupons` (admin/editor)
  - `POST /api/coupons` (admin/editor)
  - `POST /api/coupons/validate`
  - `DELETE /api/coupons/:id` (admin/editor)
- Insights
  - `GET /api/analytics` (admin/editor/cashier)
  - `GET /api/activity` (admin)
- Media
  - `POST /api/media` (admin/editor)
  - `POST /api/media/link` (admin/editor)
  - `GET /api/media` (admin/editor)

### 3.7 Core Backend Behaviors
- Public product/page visibility:
  - Unpublished products/pages are hidden from public requests.
  - Staff-authenticated requests can access unpublished entries.
- Product batch endpoint:
  - Supports deduplicated ordered lookup (`/api/products/batch`) and variant hydration.
- Order lifecycle:
  - Online and POS source support.
  - POS placement requires authenticated staff.
  - Coupon + special-offer + tax logic is applied in order totals.
  - Stock deduction/restock uses transactions and status-transition rules.
- Settings-driven storefront behavior:
  - Maintenance mode, hero/section toggles, offer controls, nav pinning, localization and theme defaults.
- Activity logs:
  - Mutating admin/staff actions are logged into `activity_logs`.

## 4. Frontend Architecture (`frontend/src`)

### 4.1 Boot and Providers
Entry point: `app/main.jsx`
- Sets global Axios `withCredentials=true`.
- Adds request interceptor for legacy bearer header fallback (`legacyToken.js`).
- Wraps app with:
  - `AuthProvider`
  - `SettingsProvider`
  - `CartProvider`
  - `WishlistProvider`
  - `ToastProvider`

### 4.2 Routing (`app/App.jsx`)
- Storefront routes:
  - `/`, `/shop`, `/product/:id`, `/cart`, `/wishlist`, `/account`, `/:slug`
- Admin routes:
  - `/admin`
  - child routes: index/analytics, activity/logs, pos, products, categories, coupons, pages, orders, customers, users, settings
- Extra route behavior:
  - `/auth/login` redirects to `/admin`.
  - `MaintenanceGate` blocks non-admin routes when maintenance mode is enabled.
  - `ScrollToTop` normalizes page-position behavior on navigation.

### 4.3 Frontend Data and State Flow
- API base URL:
  - `API_URL` from `VITE_API_URL`, fallback `/api`.
- Auth/session resolution:
  - `AuthContext` resolves admin and customer sessions using `/api/auth/me` and `/api/customers/me`.
- Cart:
  - `CartContext` is localStorage-backed and stores pricing metadata (including special-offer override info).
- Wishlist:
  - Guest wishlist is localStorage-backed.
  - On customer login it syncs guest items to server wishlist endpoints.
- Settings:
  - `SettingsContext` fetches `/api/settings` and refreshes on `settings-updated` window event.
- Toast notifications:
  - Centralized user feedback via `ToastContext`.

### 4.4 Frontend UX/System Behaviors
- Storefront layout (`StorefrontLayout.jsx`):
  - Navbar/footer are settings-driven (show/hide controls and pinned actions).
  - Command search modal (Ctrl/Cmd + K) searches products/categories.
- Admin layout (`AdminShell.jsx`):
  - Role-filtered navigation and responsive sidebar.
  - Note: API allows some cashier capabilities; sidebar link visibility is controlled separately by frontend role menu config.
- Theme/language:
  - Language persisted in localStorage.
  - Theme defaults and toggles depend on settings payload.

## 5. Runtime and Generated Boundaries
- Runtime state:
  - `backend/storage/uploads/`
- Generated artifacts:
  - `frontend/dist/`
  - `**/node_modules/`
- Backup snapshot:
  - `_backups/20260221_225007/` (source zip, DB backup, env copies, upload copies, checksums, restore steps)
- Workspace excludes:
  - Managed in `.vscode/settings.json`.
