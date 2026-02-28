import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db/connection.js';
import { initializeDatabase } from './db/init.js';
import { createDbClient } from './db/dbClient.js';
import { createAuthTools, CUSTOMER_AUTH_COOKIE, STAFF_AUTH_COOKIE } from './middleware/auth.js';
import { createAuthRateLimiter, applySecurityMiddleware } from './middleware/security.js';
import { validateOrderPayload, validateProductPayload, validateSettingsPayload } from './middleware/validators.js';
import { upload } from './middleware/upload.js';
import errorMiddleware from './middleware/error.js';
import { normalizeJsonField, normalizeSeoKeywords } from './utils/normalize.js';
import { registerAuthRoutes } from './modules/auth/auth.routes.js';
import { registerCategoryRoutes } from './modules/categories/categories.routes.js';
import { registerCouponRoutes } from './modules/coupons/coupons.routes.js';
import { registerCustomerRoutes } from './modules/customers/customers.routes.js';
import { registerInsightRoutes } from './modules/insights/insights.routes.js';
import { registerMediaRoutes } from './modules/media/media.routes.js';
import { registerOrderRoutes } from './modules/orders/orders.routes.js';
import { registerPageRoutes } from './modules/pages/pages.routes.js';
import { registerProductRoutes } from './modules/products/products.routes.js';
import { registerSettingsRoutes } from './modules/settings/settings.routes.js';
import { registerSystemRoutes } from './modules/system/system.routes.js';
import { registerUserRoutes } from './modules/users/users.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDirectory = path.resolve(__dirname, '../storage/uploads');

const app = express();

const parseTrustProxySetting = (value, fallback) => {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;

  const numeric = Number(raw);
  if (Number.isInteger(numeric) && numeric >= 0) return numeric;

  const lowered = raw.toLowerCase();
  if (['true', 'yes', 'on'].includes(lowered)) return true;
  if (['false', '0', 'no', 'off'].includes(lowered)) return false;

  // Allow Express subnet list syntax, e.g. "loopback, linklocal, uniquelocal"
  return raw;
};

const isProd = process.env.NODE_ENV === 'production';
const rawSecretKey = String(process.env.JWT_SECRET || '').trim();
if (isProd) {
  const weakSecret = rawSecretKey.length < 32 || rawSecretKey === 'dev_secret_change_me';
  if (weakSecret) {
    throw new Error('JWT_SECRET must be a strong value (minimum 32 characters) in production');
  }
}
const secretKey = rawSecretKey || 'dev_secret_change_me';
const saltRounds = Math.max(4, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
const corsOrigins = String(
  process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultTrustProxy = isProd ? false : 'loopback, linklocal, uniquelocal';
const trustProxy = parseTrustProxySetting(process.env.TRUST_PROXY, defaultTrustProxy);

app.set('trust proxy', trustProxy);

initializeDatabase({ db, isProd, saltRounds });

const dbClient = createDbClient(db);
const authRateLimiter = createAuthRateLimiter({ isProd });
const {
  authenticateToken,
  authenticateCustomerToken,
  requireRoles,
  setAuthCookie,
  clearAuthCookie,
  getVerifiedUserFromRequest
} = createAuthTools({ secretKey, isProd });

const logActivity = (userId, action, entity, entityId, details = null) => {
  const serializedDetails = details ? JSON.stringify(details) : null;
  dbClient.run(
    'INSERT INTO activity_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)',
    [userId || null, action || null, entity || null, entityId || null, serializedDetails]
  ).catch((error) => {
    console.error('⚠️ Failed to write activity log:', error.message);
  });
};

const getStaffFromRequest = (req) => {
  if (req.user && req.user.role && req.user.role !== 'customer') {
    return req.user;
  }
  const sessionUser = getVerifiedUserFromRequest(req, STAFF_AUTH_COOKIE);
  if (sessionUser?.role && sessionUser.role !== 'customer') {
    return sessionUser;
  }
  return null;
};

const getCustomerFromAuthHeader = (req) => {
  const customerSession = getVerifiedUserFromRequest(req, CUSTOMER_AUTH_COOKIE);
  if (customerSession?.role === 'customer') {
    return customerSession;
  }
  return null;
};

const requireCustomerActiveById = async (customerIdInput) => {
  const customerId = Number(customerIdInput);
  if (!Number.isInteger(customerId) || customerId <= 0) return false;
  const row = await dbClient.get('SELECT is_active FROM customers WHERE id = ?', [customerId]);
  return Number(row?.is_active || 0) === 1;
};

const ensureActiveCustomer = async (req, res, next) => {
  const customerId = Number(req.customer?.id);
  if (!Number.isInteger(customerId) || customerId <= 0) {
    return res.status(401).json({ error: 'Access Denied: Invalid customer token' });
  }

  const isActive = await requireCustomerActiveById(customerId);
  if (!isActive) {
    return res.status(403).json({ error: 'Account is inactive' });
  }

  return next();
};

const uploadSingleImage = upload.single('file');

applySecurityMiddleware(app, { corsOrigins, isProd });
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDirectory));

registerAuthRoutes({
  app,
  db,
  authRateLimiter,
  secretKey,
  saltRounds,
  setAuthCookie,
  clearAuthCookie,
  getVerifiedUserFromRequest
});

registerSystemRoutes({ app });
registerCategoryRoutes({ app, db, authenticateToken, requireRoles, logActivity });
registerProductRoutes({
  app,
  db,
  authenticateToken,
  requireRoles,
  validateProductPayload,
  logActivity,
  normalizeSeoKeywords,
  normalizeJsonField,
  getStaffFromRequest
});
registerOrderRoutes({
  app,
  db,
  authenticateToken,
  requireRoles,
  validateOrderPayload,
  getStaffFromRequest,
  getCustomerFromAuthHeader,
  requireCustomerActiveById,
  logActivity
});
registerSettingsRoutes({
  app,
  db,
  authenticateToken,
  requireRoles,
  validateSettingsPayload,
  normalizeJsonField,
  logActivity
});
registerPageRoutes({
  app,
  db,
  authenticateToken,
  requireRoles,
  normalizeJsonField,
  logActivity,
  getStaffFromRequest
});
registerUserRoutes({
  app,
  db,
  authenticateToken,
  requireRoles,
  saltRounds,
  secretKey,
  setAuthCookie,
  logActivity
});
registerCustomerRoutes({
  app,
  db,
  authRateLimiter,
  secretKey,
  saltRounds,
  setAuthCookie,
  clearAuthCookie,
  getVerifiedUserFromRequest,
  authenticateCustomerToken,
  ensureActiveCustomer,
  authenticateToken,
  requireRoles,
  logActivity
});
registerCouponRoutes({
  app,
  db,
  authenticateToken,
  requireRoles
});
registerMediaRoutes({
  app,
  db,
  authenticateToken,
  requireRoles,
  uploadSingleImage
});
registerInsightRoutes({
  app,
  db,
  authenticateToken,
  requireRoles
});

app.use(errorMiddleware);

export default app;

