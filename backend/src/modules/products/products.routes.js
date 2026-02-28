import { createDbClient } from '../../db/dbClient.js';
import { createProductRepository } from './products.repository.js';
import { createProductService } from './products.service.js';
import { respondWithServiceResult } from '../../utils/http.js';

export const registerProductRoutes = ({
  app,
  db,
  authenticateToken,
  requireRoles,
  validateProductPayload,
  logActivity,
  normalizeSeoKeywords,
  normalizeJsonField,
  getStaffFromRequest
}) => {
  const dbClient = createDbClient(db);
  const productRepository = createProductRepository({ dbClient });
  const productService = createProductService({
    productRepository,
    normalizeSeoKeywords,
    normalizeJsonField
  });

  app.get('/api/products', async (req, res) => {
    const result = await productService.listProducts(req.query || {}, getStaffFromRequest(req));
    return respondWithServiceResult(res, result);
  });

  app.get('/api/products/:id/reviews', async (req, res) => {
    const result = await productService.listReviews(req.params.id, getStaffFromRequest(req), req.query || {});
    return respondWithServiceResult(res, result);
  });

  app.post('/api/products/:id/reviews', async (req, res) => {
    const result = await productService.createReview(req.params.id, getStaffFromRequest(req), req.body || {}, req.query || {});
    return respondWithServiceResult(res, result);
  });

  app.post('/api/products/bulk', authenticateToken, requireRoles('admin', 'editor'), async (req, res) => {
    const result = await productService.bulkAction(req.body || {});
    if (!result.ok) return respondWithServiceResult(res, result);

    if (result.meta?.action === 'delete') {
      logActivity(req.user.id, 'bulk_delete', 'product', null, { ids: result.meta.ids });
    } else if (result.meta?.action === 'update') {
      logActivity(req.user.id, 'bulk_update', 'product', null, { ids: result.meta.ids, updates: result.meta.updates });
    } else if (result.meta?.action === 'adjust_price') {
      logActivity(req.user.id, 'bulk_adjust_price', 'product', null, {
        percent: result.meta.percent,
        category: result.meta.category
      });
    }

    return respondWithServiceResult(res, result);
  });

  app.get('/api/products/batch', async (req, res) => {
    const result = await productService.listProductsBatch(req.query || {}, getStaffFromRequest(req));
    return respondWithServiceResult(res, result);
  });

  app.get('/api/products/:id', async (req, res) => {
    const result = await productService.getProductById(req.params.id, getStaffFromRequest(req), req.query || {});
    return respondWithServiceResult(res, result);
  });

  app.post(
    '/api/products',
    authenticateToken,
    requireRoles('admin', 'editor'),
    validateProductPayload,
    async (req, res) => {
      const result = await productService.createProduct(req.body || {});
      if (!result.ok) return respondWithServiceResult(res, result);

      logActivity(req.user.id, 'create', 'product', result.meta.productId, { name: result.meta.name });
      return respondWithServiceResult(res, result);
    }
  );

  app.put(
    '/api/products/:id',
    authenticateToken,
    requireRoles('admin', 'editor'),
    validateProductPayload,
    async (req, res) => {
      const result = await productService.updateProduct(req.params.id, req.body || {});
      if (!result.ok) return respondWithServiceResult(res, result);

      logActivity(req.user.id, 'update', 'product', req.params.id, { name: result.meta.name });
      return respondWithServiceResult(res, result);
    }
  );

  app.delete('/api/products/:id', authenticateToken, requireRoles('admin', 'editor'), async (req, res) => {
    const result = await productService.deleteProduct(req.params.id);
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, 'delete', 'product', req.params.id);
    return respondWithServiceResult(res, result);
  });
};

