# Click-Store Project Guide

## 1. Current Scope
Click-Store currently contains:
- A React + Vite frontend (`frontend/`) for both storefront and admin UI.
- An Express + PostgreSQL backend API (`backend/`).
- Runtime media uploads under `backend/storage/uploads/`.
- A local restore snapshot under `_backups/20260221_225007/`.

Primary user-facing routes in the frontend:
- Storefront: `/`, `/shop`, `/product/:id`, `/cart`, `/wishlist`, `/account`, `/:slug`.
- Admin: `/admin` with nested sections for analytics/dashboard, activity, POS, products, categories, coupons, pages, orders, customers, users, settings.

Primary API modules in the backend:
- `auth`, `customers`, `users`, `products`, `categories`, `orders`, `pages`, `settings`, `coupons`, `media`, `insights`, `system`.

Auth model:
- Cookie-first auth (staff + customer cookies).
- Optional temporary legacy bearer-token fallback.

## 2. Repository Layout
- `.vscode/`
  - Workspace excludes and search settings.
- `backend/`
  - `src/` app boot, middleware, modules, DB layer.
  - `scripts/postgres-smoke.js` standalone PostgreSQL smoke script.
  - `tests/api-smoke.test.js` Node test suite.
  - `storage/uploads/` runtime uploaded files.
- `frontend/`
  - `src/` React application source.
  - `scripts/check-storefront-semantic.mjs` semantic storefront guard.
  - `public/` static assets.
  - `dist/` generated production build output.
- `_backups/20260221_225007/`
  - Snapshot bundle (`click-store_source_snapshot.zip`), DB backup (`ecommerce_v2.db`), restore/checksum manifests, copied env files, and copied upload files.

## 3. Environment Variables
### 3.1 Backend (`backend/.env`)
Variables used by runtime code:
- `PORT` (default `5000`)
- `HOST` (default `0.0.0.0`)
- `NODE_ENV` (`development` / `production` / `test`)
- `JWT_SECRET` (required and must be strong in production)
- `BCRYPT_SALT_ROUNDS` (optional, default `10`, minimum effective value `4`)
- `CORS_ORIGINS` (comma-separated allowlist)
- `CORS_ORIGIN` (legacy single-origin alias still accepted)
- `DATABASE_URL` (full PostgreSQL connection string, optional)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (discrete PostgreSQL config)
- `PG_SSL`, `PG_SSL_REJECT_UNAUTHORIZED` (PostgreSQL SSL toggles)
- `PG_POOL_MAX` (accepted, but runtime currently forces pool size to `1`)
- `ADMIN_BOOTSTRAP_USERNAME` (initial admin username on empty users table)
- `ADMIN_BOOTSTRAP_PASSWORD` (required for first seed in production)
- `ENABLE_LEGACY_BEARER_FALLBACK` (`1` by default; set `0` to disable bearer fallback)

Template-only note:
- `DB_CLIENT` appears in `backend/.env.example` but is not currently read by runtime code.

### 3.2 Frontend (`frontend/.env`)
- `VITE_API_URL` (falls back to `/api` when empty)

## 4. Local Development
From repository root (separate terminals):

```powershell
# Install dependencies
npm install --prefix backend
npm install --prefix frontend

# Backend dev server
npm run dev --prefix backend

# Frontend dev server
npm run dev --prefix frontend
```

Default local URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## 5. Verification Commands
```powershell
# Backend syntax check
npm run check --prefix backend

# Backend tests
npm test --prefix backend

# Backend PostgreSQL smoke run
npm run test:postgres-smoke --prefix backend

# Frontend lint
npm run lint --prefix frontend

# Frontend semantic storefront guard
npm run check:semantic-storefront --prefix frontend

# Frontend production build
npm run build --prefix frontend

# Frontend combined checks
npm run check:all --prefix frontend
```

## 6. Runtime, Generated, and Backup Boundaries
Source-of-truth code:
- `backend/src/**`
- `backend/tests/**`
- `backend/scripts/**`
- `frontend/src/**`
- `frontend/scripts/**`

Runtime data:
- `backend/storage/uploads/**`

Generated artifacts:
- `frontend/dist/**`
- `**/node_modules/**`

Backup snapshot (not source-of-truth for live code):
- `_backups/20260221_225007/**`

## 7. Operational Notes
- Schema + seed are triggered at backend startup (async bootstrap).
- Initial seed creates default admin/settings/categories/products/pages when tables are empty.
- `POST /api/orders` supports online orders publicly; POS source requires authenticated staff.
- Maintenance mode in settings blocks non-admin storefront routes.
- Wishlist supports guest mode in localStorage and server sync after customer login.

## 8. Documentation Map
- `ARCHITECTURE.md`: module architecture, boot flow, auth/session model, route groups, data flow.
- `TREE_WITH_DESCRIPTIONS.md`: current repo tree with short per-file descriptions (excluding `node_modules`; generated/runtime folders summarized).
