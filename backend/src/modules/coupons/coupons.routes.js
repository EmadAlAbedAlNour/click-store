import { createDbClient } from '../../db/dbClient.js';
import { createCouponRepository } from './coupons.repository.js';
import { createCouponService } from './coupons.service.js';
import { respondWithServiceResult } from '../../utils/http.js';

export const registerCouponRoutes = ({
  app,
  db,
  authenticateToken,
  requireRoles
}) => {
  const dbClient = createDbClient(db);
  const couponRepository = createCouponRepository(dbClient);
  const couponService = createCouponService({ couponRepository });

  app.get('/api/coupons', authenticateToken, requireRoles('admin', 'editor'), async (req, res) => {
    const result = await couponService.listCoupons();
    return respondWithServiceResult(res, result);
  });

  app.post('/api/coupons', authenticateToken, requireRoles('admin', 'editor'), async (req, res) => {
    const result = await couponService.createCoupon(req.body);
    return respondWithServiceResult(res, result);
  });

  app.post('/api/coupons/validate', async (req, res) => {
    const result = await couponService.validateCoupon(req.body);
    return respondWithServiceResult(res, result);
  });

  app.delete('/api/coupons/:id', authenticateToken, requireRoles('admin', 'editor'), async (req, res) => {
    const result = await couponService.deleteCoupon(req.params.id);
    return respondWithServiceResult(res, result);
  });
};

