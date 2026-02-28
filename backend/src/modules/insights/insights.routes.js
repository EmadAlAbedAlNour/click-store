import { createDbClient } from '../../db/dbClient.js';
import { createInsightRepository } from './insights.repository.js';
import { createInsightService } from './insights.service.js';
import { respondWithCaughtError } from '../../utils/http.js';

export const registerInsightRoutes = ({
  app,
  db,
  authenticateToken,
  requireRoles
}) => {
  const dbClient = createDbClient(db);
  const insightRepository = createInsightRepository(dbClient);
  const insightService = createInsightService({ insightRepository });

  app.get('/api/analytics', authenticateToken, requireRoles('admin', 'editor', 'cashier'), async (req, res) => {
    try {
      const payload = await insightService.buildAnalytics(req.query.days);
      res.json(payload);
    } catch (error) {
      respondWithCaughtError(res, error, 'Failed to build analytics');
    }
  });

  app.get('/api/activity', authenticateToken, requireRoles('admin'), async (req, res) => {
    try {
      const rows = await insightService.listActivity(req.query.limit);
      res.json(rows || []);
    } catch (error) {
      respondWithCaughtError(res, error, 'Unable to load activity log');
    }
  });
};

