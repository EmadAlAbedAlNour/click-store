import { createDbClient } from '../../db/dbClient.js';
import { createSettingsRepository } from './settings.repository.js';
import { createSettingsService } from './settings.service.js';
import { respondWithServiceResult } from '../../utils/http.js';

export const registerSettingsRoutes = ({
  app,
  db,
  authenticateToken,
  requireRoles,
  validateSettingsPayload,
  normalizeJsonField,
  logActivity
}) => {
  const dbClient = createDbClient(db);
  const settingsRepository = createSettingsRepository(dbClient);
  const settingsService = createSettingsService({ settingsRepository, normalizeJsonField });

  app.get('/api/settings', async (req, res) => {
    const result = await settingsService.getSettings();
    return respondWithServiceResult(res, result);
  });

  app.put('/api/settings', authenticateToken, requireRoles('admin'), validateSettingsPayload, async (req, res) => {
    const result = await settingsService.updateSettings(req.body || {});
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, 'update', 'settings', 1, { fields: result.meta.fields });
    return respondWithServiceResult(res, result);
  });
};

