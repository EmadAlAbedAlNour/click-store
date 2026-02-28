import { createDbClient } from '../../db/dbClient.js';
import { createPageRepository } from './pages.repository.js';
import { createPageService } from './pages.service.js';
import { respondWithServiceResult } from '../../utils/http.js';

export const registerPageRoutes = ({
  app,
  db,
  authenticateToken,
  requireRoles,
  normalizeJsonField,
  logActivity,
  getStaffFromRequest
}) => {
  const dbClient = createDbClient(db);
  const pageRepository = createPageRepository(dbClient);
  const pageService = createPageService({ pageRepository, normalizeJsonField });

  app.get('/api/pages', async (req, res) => {
    const result = await pageService.listPages(getStaffFromRequest(req));
    return respondWithServiceResult(res, result);
  });

  app.get('/api/pages/:slug', async (req, res) => {
    const result = await pageService.getPageBySlug(req.params.slug, getStaffFromRequest(req));
    return respondWithServiceResult(res, result);
  });

  app.post('/api/pages', authenticateToken, requireRoles('admin'), async (req, res) => {
    const result = await pageService.savePage(req.body || {});
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, result.meta.action, 'page', result.meta.pageId, {
      slug: result.meta.slug,
      title: result.meta.title,
      blocks: result.meta.blocks,
      is_published: result.meta.is_published
    });
    return respondWithServiceResult(res, result);
  });

  app.put('/api/pages/:id/publish', authenticateToken, requireRoles('admin'), async (req, res) => {
    const result = await pageService.setPublishState(req.params.id, req.body || {});
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, 'update', 'page', result.meta.pageId, { is_published: result.meta.is_published });
    return respondWithServiceResult(res, result);
  });

  app.delete('/api/pages/:slug', authenticateToken, requireRoles('admin'), async (req, res) => {
    const result = await pageService.deletePage(req.params.slug);
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, 'delete', 'page', result.meta.pageId, { slug: result.meta.slug });
    return respondWithServiceResult(res, result);
  });
};

