import { CUSTOMER_AUTH_COOKIE } from '../../middleware/auth.js';
import { createDbClient } from '../../db/dbClient.js';
import { createCustomerRepository } from './customers.repository.js';
import { createCustomerService } from './customers.service.js';
import { respondWithServiceResult } from '../../utils/http.js';

export const registerCustomerRoutes = ({
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
}) => {
  const dbClient = createDbClient(db);
  const customerRepository = createCustomerRepository(dbClient);
  const customerService = createCustomerService({
    customerRepository,
    secretKey,
    saltRounds
  });

  app.post('/api/customers/register', authRateLimiter, async (req, res) => {
    const result = await customerService.registerCustomer(req.body);
    if (!result.ok) return respondWithServiceResult(res, result);

    setAuthCookie(res, CUSTOMER_AUTH_COOKIE, result.token, result.cookieMaxAgeMs);
    return respondWithServiceResult(res, result);
  });

  app.post('/api/customers/login', authRateLimiter, async (req, res) => {
    const result = await customerService.loginCustomer(req.body);
    if (!result.ok) return respondWithServiceResult(res, result);

    setAuthCookie(res, CUSTOMER_AUTH_COOKIE, result.token, result.cookieMaxAgeMs);
    return respondWithServiceResult(res, result);
  });

  app.post('/api/customers/logout', (req, res) => {
    clearAuthCookie(res, CUSTOMER_AUTH_COOKIE);
    res.json({ message: 'Customer logged out' });
  });

  app.get('/api/customers/me', async (req, res) => {
    const customerSession = getVerifiedUserFromRequest(req, CUSTOMER_AUTH_COOKIE);
    const result = await customerService.resolveCustomerMe(customerSession);
    if (!result.ok) return respondWithServiceResult(res, result);

    if (result.clearCookie) {
      clearAuthCookie(res, CUSTOMER_AUTH_COOKIE);
    }
    return respondWithServiceResult(res, result);
  });

  app.put('/api/customers/me', authenticateCustomerToken, ensureActiveCustomer, async (req, res) => {
    const result = await customerService.updateOwnProfile(req.customer.id, req.body || {});
    return respondWithServiceResult(res, result);
  });

  app.get('/api/customers/orders', authenticateCustomerToken, ensureActiveCustomer, async (req, res) => {
    const result = await customerService.listOwnOrders(req.customer.id);
    return respondWithServiceResult(res, result);
  });

  app.get('/api/customers', authenticateToken, requireRoles('admin'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const result = await customerService.listCustomersForAdmin();
    return respondWithServiceResult(res, result);
  });

  app.put('/api/customers/:id', authenticateToken, requireRoles('admin'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const result = await customerService.updateCustomerForAdmin(req.params.id, req.body || {});
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, 'update', 'customer', result.meta.customerId, { fields: result.meta.updatedFieldsCount });
    return respondWithServiceResult(res, result);
  });

  app.get('/api/customers/:id/orders', authenticateToken, requireRoles('admin'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const result = await customerService.listCustomerOrdersForAdmin(req.params.id);
    return respondWithServiceResult(res, result);
  });

  app.get('/api/wishlist', authenticateCustomerToken, ensureActiveCustomer, async (req, res) => {
    const result = await customerService.listWishlist(req.customer.id);
    return respondWithServiceResult(res, result);
  });

  app.post('/api/wishlist', authenticateCustomerToken, ensureActiveCustomer, async (req, res) => {
    const result = await customerService.addWishlistItem(req.customer.id, req.body?.product_id);
    return respondWithServiceResult(res, result);
  });

  app.delete('/api/wishlist/:productId', authenticateCustomerToken, ensureActiveCustomer, async (req, res) => {
    const result = await customerService.removeWishlistItem(req.customer.id, req.params.productId);
    return respondWithServiceResult(res, result);
  });
};

