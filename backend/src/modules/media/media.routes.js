import { createDbClient } from '../../db/dbClient.js';
import { createMediaRepository } from './media.repository.js';
import { createMediaService } from './media.service.js';
import { respondWithServiceResult } from '../../utils/http.js';

export const registerMediaRoutes = ({
  app,
  db,
  authenticateToken,
  requireRoles,
  uploadSingleImage
}) => {
  const dbClient = createDbClient(db);
  const mediaRepository = createMediaRepository(dbClient);
  const mediaService = createMediaService({ mediaRepository });

  app.post('/api/media', authenticateToken, requireRoles('admin', 'editor'), uploadSingleImage, async (req, res) => {
    const result = await mediaService.uploadFile({
      file: req.file,
      protocol: req.protocol,
      host: req.get('host')
    });

    return respondWithServiceResult(res, result);
  });

  app.post('/api/media/link', authenticateToken, requireRoles('admin', 'editor'), async (req, res) => {
    const result = await mediaService.addExternalLink(req.body?.url);
    return respondWithServiceResult(res, result);
  });

  app.get('/api/media', authenticateToken, requireRoles('admin', 'editor'), async (req, res) => {
    const result = await mediaService.listMedia();
    return respondWithServiceResult(res, result);
  });
};

