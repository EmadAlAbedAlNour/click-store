# TREE_WITH_DESCRIPTIONS

Generated from project root. Excludes `node_modules`.
`backend/storage/uploads` and `frontend/dist` are summarized (not expanded file-by-file).
`_backups/20260221_225007/backend_uploads` is summarized (media filenames omitted).

```text
.
+---.vscode
|   \---settings.json # Workspace file/search/watcher exclusions for heavy/generated folders.
+---_backups
|   \---20260221_225007 # Local restore snapshot bundle.
|       +---backend_uploads # Backup copy of uploaded media files (folder preserved, file list omitted).
|       +---env_files
|       |   +---backend_.env # Backed-up backend env values captured with snapshot.
|       |   +---backend_.env.example # Backed-up backend env template captured with snapshot.
|       |   +---frontend_.env # Backed-up frontend env values captured with snapshot.
|       |   \---frontend_.env.example # Backed-up frontend env template captured with snapshot.
|       +---checksums.sha256.txt # SHA256 checksums for snapshot integrity verification.
|       +---click-store_source_snapshot.zip # Source-code archive captured at backup time.
|       +---ecommerce_v2.db # Database backup artifact included in snapshot set.
|       +---manifest.txt # Snapshot manifest metadata.
|       \---RESTORE_STEPS.txt # Restore instructions for backup artifacts.
+---backend
|   +---scripts
|   |   \---postgres-smoke.js # Standalone PostgreSQL smoke test script.
|   +---src
|   |   +---db
|   |   |   +---connection.js # PostgreSQL Pool setup from env (URL/discrete vars + SSL flags).
|   |   |   +---dbClient.js # Adapter exposing get/all/run with placeholder conversion.
|   |   |   +---init.js # Startup DB bootstrap trigger (schema + seed).
|   |   |   +---schema.js # Core table creation SQL.
|   |   |   \---seed.js # Initial data seed logic for admin/settings/catalog/pages.
|   |   +---middleware
|   |   |   +---auth.js # Staff/customer auth helpers, role checks, cookie and bearer fallback handling.
|   |   |   +---error.js # Final API error middleware.
|   |   |   +---security.js # Helmet/CORS/rate-limit middleware setup.
|   |   |   +---upload.js # Multer upload config (type/size checks + safe filenames).
|   |   |   \---validators.js # Request payload validation for products/orders/settings.
|   |   +---modules
|   |   |   +---auth
|   |   |   |   +---auth.repository.js # Staff auth queries.
|   |   |   |   +---auth.routes.js # Staff login/me/logout endpoints.
|   |   |   |   \---auth.service.js # Staff auth business logic and token issuance.
|   |   |   +---categories
|   |   |   |   +---categories.repository.js # Category SQL operations.
|   |   |   |   +---categories.routes.js # Category API routes.
|   |   |   |   \---categories.service.js # Category business rules.
|   |   |   +---coupons
|   |   |   |   +---coupons.repository.js # Coupon SQL operations.
|   |   |   |   +---coupons.routes.js # Coupon management/validation endpoints.
|   |   |   |   \---coupons.service.js # Coupon validation and CRUD logic.
|   |   |   +---customers
|   |   |   |   +---customers.repository.js # Customer/wishlist/order SQL operations.
|   |   |   |   +---customers.routes.js # Customer auth/profile/admin + wishlist endpoints.
|   |   |   |   \---customers.service.js # Customer account and wishlist business logic.
|   |   |   +---insights
|   |   |   |   +---insights.repository.js # Analytics/activity SQL queries.
|   |   |   |   +---insights.routes.js # Analytics and activity endpoints.
|   |   |   |   \---insights.service.js # Insights payload shaping logic.
|   |   |   +---media
|   |   |   |   +---media.repository.js # Media SQL operations.
|   |   |   |   +---media.routes.js # Media upload/list/link endpoints.
|   |   |   |   \---media.service.js # Media business rules and response shaping.
|   |   |   +---orders
|   |   |   |   +---orders.repository.js # Order and stock transaction SQL operations.
|   |   |   |   +---orders.routes.js # Order create/list/update/bulk routes.
|   |   |   |   \---orders.service.js # Order lifecycle, pricing, and stock adjustment logic.
|   |   |   +---pages
|   |   |   |   +---pages.repository.js # CMS page/page-block SQL operations.
|   |   |   |   +---pages.routes.js # Page list/get/save/publish/delete routes.
|   |   |   |   \---pages.service.js # CMS page business rules and guards.
|   |   |   +---products
|   |   |   |   +---products.repository.js # Product/variant/review SQL operations.
|   |   |   |   +---products.routes.js # Product CRUD, batch, and review endpoints.
|   |   |   |   \---products.service.js # Product visibility, bulk actions, and variant hydration logic.
|   |   |   +---settings
|   |   |   |   +---settings.repository.js # Settings SQL operations.
|   |   |   |   +---settings.routes.js # Settings read/update endpoints.
|   |   |   |   \---settings.service.js # Settings normalization and persistence logic.
|   |   |   +---system
|   |   |   |   \---system.routes.js # Health-check routes.
|   |   |   \---users
|   |   |       +---users.repository.js # Staff user SQL operations.
|   |   |       +---users.routes.js # Staff user management routes.
|   |   |       \---users.service.js # Staff user validation and role/business rules.
|   |   +---utils
|   |   |   +---http.js # Shared HTTP response helpers.
|   |   |   \---normalize.js # JSON/SEO normalization helpers.
|   |   +---app.js # Express app assembly (middleware + route registration).
|   |   \---server.js # Server entrypoint, env loading, listen, and graceful shutdown.
|   +---storage
|   |   \---uploads # Runtime uploaded media files (folder summarized).
|   +---tests
|   |   \---api-smoke.test.js # End-to-end-ish API smoke tests via Node test runner + supertest.
|   +---.env # Local backend environment file.
|   +---.env.example # Backend environment template.
|   +---package.json # Backend scripts/dependencies manifest.
|   \---package-lock.json # Backend npm lockfile.
+---frontend
|   +---dist # Generated frontend build output (folder summarized).
|   +---public
|   |   +---_redirects # Hosting redirect rules for SPA routing.
|   |   \---vite.svg # Static SVG asset.
|   +---scripts
|   |   \---check-storefront-semantic.mjs # Semantic storefront guard used in frontend checks.
|   +---src
|   |   +---app
|   |   |   +---App.jsx # Top-level route composition and app orchestration.
|   |   |   +---config.js # Frontend runtime API base config.
|   |   |   \---main.jsx # React bootstrap + provider mount point.
|   |   +---features
|   |   |   +---admin
|   |   |   |   +---layout
|   |   |   |   |   \---AdminShell.jsx # Admin route wrapper, login shell, sidebar layout.
|   |   |   |   +---pages
|   |   |   |   |   +---AdminActivity.jsx # Admin activity page.
|   |   |   |   |   +---AdminCategories.jsx # Admin categories management page.
|   |   |   |   |   +---AdminCoupons.jsx # Admin coupon management page.
|   |   |   |   |   +---AdminCustomers.jsx # Admin customer management page.
|   |   |   |   |   +---AdminOrders.jsx # Admin orders management page.
|   |   |   |   |   +---AdminPagesPanel.jsx # Admin CMS/page-builder panel.
|   |   |   |   |   +---AdminUsers.jsx # Admin staff-user management page.
|   |   |   |   |   \---DashboardPage.jsx # Admin dashboard/analytics page.
|   |   |   |   +---pos
|   |   |   |   |   \---AdminPOS.jsx # Admin point-of-sale page.
|   |   |   |   +---products
|   |   |   |   |   +---components
|   |   |   |   |   |   +---helpers.js # Product panel helper utilities.
|   |   |   |   |   |   +---ProductFormView.jsx # Product create/edit form view.
|   |   |   |   |   |   +---ProductListView.jsx # Product list/grid management view.
|   |   |   |   |   |   \---Toast.jsx # Product panel local toast component.
|   |   |   |   |   \---AdminProductsPanel.jsx # Admin product management container.
|   |   |   |   +---settings
|   |   |   |   |   \---AdminSettingsPanel.jsx # Admin settings management panel.
|   |   |   |   +---shared
|   |   |   |   |   \---adminShared.jsx # Shared admin UI helpers/components/translations.
|   |   |   |   +---utils
|   |   |   |   |   \---printSanitizer.js # Print-output sanitization helpers.
|   |   |   |   \---AdminComponents.jsx # Consolidated admin component exports/wrappers.
|   |   |   +---storefront
|   |   |   |   +---i18n
|   |   |   |   |   \---publicTexts.js # Public UI translations/content strings.
|   |   |   |   +---layout
|   |   |   |   |   \---StorefrontLayout.jsx # Storefront shell: navbar, footer, command search, transitions.
|   |   |   |   +---pages
|   |   |   |   |   +---AccountPage.jsx # Customer account/login page.
|   |   |   |   |   +---CartPage.jsx # Cart page and checkout interaction UI.
|   |   |   |   |   +---DynamicPage.jsx # Dynamic CMS slug page renderer.
|   |   |   |   |   +---ProductDetailsPage.jsx # Product detail page.
|   |   |   |   |   +---ShopPage.jsx # Product listing/search page.
|   |   |   |   |   +---StorefrontPages.jsx # Re-export hub for storefront pages.
|   |   |   |   |   +---StorefrontPageShared.jsx # Shared storefront page utilities/components.
|   |   |   |   |   \---WishlistPage.jsx # Wishlist page.
|   |   |   |   \---utils
|   |   |   |       \---storefrontUtils.js # Storefront utility helpers (theme/pricing helpers).
|   |   |   \---system
|   |   |       \---SystemRoutes.jsx # Maintenance gate + scroll restoration helpers.
|   |   +---shared
|   |   |   +---api
|   |   |   |   +---authConfig.js # Auth config constants used by frontend API/auth code.
|   |   |   |   +---axiosClient.js # Preconfigured Axios client instance.
|   |   |   |   \---legacyToken.js # Legacy localStorage token compatibility helpers.
|   |   |   +---components
|   |   |   |   \---ThemeToggle.jsx # Shared light/dark theme toggle component.
|   |   |   +---contexts
|   |   |   |   +---AuthContext.jsx # Admin/customer session state + login/logout actions.
|   |   |   |   +---CartContext.jsx # Cart state with localStorage persistence.
|   |   |   |   +---SettingsContext.jsx # Global settings fetch/refresh state.
|   |   |   |   +---ToastContext.jsx # Toast notification state and dispatch helpers.
|   |   |   |   \---WishlistContext.jsx # Guest/server wishlist state + sync logic.
|   |   |   +---hooks
|   |   |   |   +---useDebounce.js # Debounce hook.
|   |   |   |   +---useFetch.js # Generic fetch/request hook.
|   |   |   |   +---useForm.js # Form state helper hook.
|   |   |   |   \---useTheme.js # Theme state hook.
|   |   |   \---utils
|   |   |       \---localeDigits.js # Locale digit conversion helper utilities.
|   |   \---index.css # Global styles and design tokens.
|   +---.env # Local frontend environment file.
|   +---.env.example # Frontend environment template.
|   +---eslint.config.js # Frontend lint configuration.
|   +---index.html # Vite HTML entrypoint.
|   +---package.json # Frontend scripts/dependencies manifest.
|   +---package-lock.json # Frontend npm lockfile.
|   +---postcss.config.js # PostCSS configuration.
|   +---README.md # Frontend README scaffold.
|   +---tailwind.config.js # Tailwind configuration.
|   \---vite.config.js # Vite configuration.
+---ARCHITECTURE.md # Architecture reference for backend/frontend internals.
+---PROJECT.md # Project operations guide (scope, env, run/verify workflow).
\---TREE_WITH_DESCRIPTIONS.md # This file.
```
