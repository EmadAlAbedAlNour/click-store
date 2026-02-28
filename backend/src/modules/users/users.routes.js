import { STAFF_AUTH_COOKIE } from '../../middleware/auth.js';
import { createDbClient } from '../../db/dbClient.js';
import { createUserRepository } from './users.repository.js';
import { createUserService } from './users.service.js';
import { respondWithServiceResult } from '../../utils/http.js';

const STAFF_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24;

export const registerUserRoutes = ({
  app,
  db,
  authenticateToken,
  requireRoles,
  saltRounds,
  secretKey,
  setAuthCookie,
  logActivity
}) => {
  const dbClient = createDbClient(db);
  const userRepository = createUserRepository(dbClient);
  const userService = createUserService({ userRepository, saltRounds, secretKey });

  app.get('/api/users', authenticateToken, requireRoles('admin'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const result = await userService.listUsers();
    return respondWithServiceResult(res, result);
  });

  app.post('/api/users', authenticateToken, requireRoles('admin'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const result = await userService.createUser(req.body || {});
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, 'create', 'user', result.meta.userId, { username: result.meta.username });
    return respondWithServiceResult(res, result);
  });

  app.put('/api/users/:id', authenticateToken, requireRoles('admin'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const result = await userService.updateUser({
      targetId: req.params.id,
      payload: req.body || {},
      requestUserId: req.user.id
    });
    if (!result.ok) return respondWithServiceResult(res, result);

    if (result.refreshedToken) {
      setAuthCookie(res, STAFF_AUTH_COOKIE, result.refreshedToken, STAFF_TOKEN_MAX_AGE_MS);
    }
    logActivity(req.user.id, 'update', 'user', req.params.id, { full_name: result.meta.full_name });
    return respondWithServiceResult(res, result);
  });

  app.delete('/api/users/:id', authenticateToken, requireRoles('admin'), async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const result = await userService.deleteUser(req.params.id);
    if (!result.ok) return respondWithServiceResult(res, result);

    logActivity(req.user.id, 'delete', 'user', req.params.id);
    return respondWithServiceResult(res, result);
  });
};

