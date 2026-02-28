import { createDbClient } from '../../db/dbClient.js';
import { createOrderRepository } from './orders.repository.js';
import { createOrderService } from './orders.service.js';
import { respondWithCaughtError } from '../../utils/http.js';

export const registerOrderRoutes = ({
  app,
  db,
  authenticateToken,
  requireRoles,
  validateOrderPayload,
  getStaffFromRequest,
  getCustomerFromAuthHeader,
  requireCustomerActiveById,
  logActivity
}) => {
  const dbClient = createDbClient(db);
  const orderRepository = createOrderRepository(dbClient);
  const orderService = createOrderService({ orderRepository });

  app.post('/api/orders', validateOrderPayload, async (req, res) => {
    try {
      const result = await orderService.placeOrder({
        payload: req.body,
        staffUser: getStaffFromRequest(req),
        customer: getCustomerFromAuthHeader(req),
        requireCustomerActiveById
      });
      res.json(result);
    } catch (error) {
      respondWithCaughtError(res, error, 'Unable to place order');
    }
  });

  app.get('/api/orders', authenticateToken, requireRoles('admin', 'editor', 'cashier'), async (req, res) => {
    try {
      const rows = await orderService.listOrders();
      res.json(rows);
    } catch (error) {
      respondWithCaughtError(res, error, 'Unable to list orders');
    }
  });

  app.put('/api/orders/bulk', authenticateToken, requireRoles('admin', 'editor', 'cashier'), async (req, res) => {
    try {
      const result = await orderService.bulkUpdateOrders({
        payload: req.body || {},
        userId: req.user.id,
        logActivity
      });
      res.json(result);
    } catch (error) {
      respondWithCaughtError(res, error, 'Unable to bulk update orders');
    }
  });

  app.put('/api/orders/:id', authenticateToken, requireRoles('admin', 'editor', 'cashier'), async (req, res) => {
    try {
      const result = await orderService.updateOrder({
        orderIdInput: req.params.id,
        payload: req.body || {},
        userId: req.user.id,
        logActivity
      });
      res.json(result);
    } catch (error) {
      respondWithCaughtError(res, error, 'Unable to update order');
    }
  });
};

