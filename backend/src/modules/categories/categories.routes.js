import { createDbClient } from '../../db/dbClient.js';
import { createCategoryRepository } from './categories.repository.js';
import { createCategoryService } from './categories.service.js';
import { respondWithServiceResult } from '../../utils/http.js';

export const registerCategoryRoutes = ({
  app,
  db,
  authenticateToken,
  requireRoles,
  logActivity
}) => {
  const dbClient = createDbClient(db);
  const categoryRepository = createCategoryRepository(dbClient);
  const categoryService = createCategoryService({ categoryRepository });

  app.get('/api/categories', async (req, res) => {
    const result = await categoryService.listCategories();
    return respondWithServiceResult(res, result);
  });

  app.post('/api/categories', authenticateToken, requireRoles('admin', 'editor'), async (req, res) => {
    const result = await categoryService.createCategory(req.body || {});
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, 'create', 'category', result.meta.categoryId, { name: result.meta.name });
    return respondWithServiceResult(res, result);
  });

  app.put('/api/categories/:id', authenticateToken, requireRoles('admin', 'editor'), async (req, res) => {
    const result = await categoryService.updateCategory(req.params.id, req.body || {});
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, 'update', 'category', result.meta.categoryId, { name: result.meta.name });
    return respondWithServiceResult(res, result);
  });

  app.delete('/api/categories/:id', authenticateToken, requireRoles('admin', 'editor'), async (req, res) => {
    const result = await categoryService.deleteCategory(req.params.id);
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, 'delete', 'category', req.params.id);
    return respondWithServiceResult(res, result);
  });
};

