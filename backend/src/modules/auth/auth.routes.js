import { STAFF_AUTH_COOKIE } from '../../middleware/auth.js';
import { createDbClient } from '../../db/dbClient.js';
import { createAuthRepository } from './auth.repository.js';
import { createAuthService } from './auth.service.js';
import { respondWithServiceResult } from '../../utils/http.js';

export const registerAuthRoutes = ({
  app,
  db,
  authRateLimiter,
  secretKey,
  saltRounds,
  setAuthCookie,
  clearAuthCookie,
  getVerifiedUserFromRequest
}) => {
  const dbClient = createDbClient(db);
  const authRepository = createAuthRepository(dbClient);
  const authService = createAuthService({
    authRepository,
    secretKey,
    saltRounds
  });

  app.post('/api/login', authRateLimiter, async (req, res) => {
    const result = await authService.login(req.body || {});
    if (!result.ok) return respondWithServiceResult(res, result);

    setAuthCookie(res, STAFF_AUTH_COOKIE, result.token, result.cookieMaxAgeMs);
    return respondWithServiceResult(res, result);
  });

  app.get('/api/auth/me', async (req, res) => {
    const sessionUser = getVerifiedUserFromRequest(req, STAFF_AUTH_COOKIE);
    const result = await authService.resolveMe(sessionUser);
    if (!result.ok) return respondWithServiceResult(res, result);

    if (result.clearCookie) clearAuthCookie(res, STAFF_AUTH_COOKIE);
    return respondWithServiceResult(res, result);
  });

  app.post('/api/logout', (req, res) => {
    const result = authService.logout();
    clearAuthCookie(res, STAFF_AUTH_COOKIE);
    return respondWithServiceResult(res, result);
  });
};

