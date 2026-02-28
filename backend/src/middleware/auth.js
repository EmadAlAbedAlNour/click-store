import jwt from 'jsonwebtoken';

export const STAFF_AUTH_COOKIE = 'staff_auth_token';
export const CUSTOMER_AUTH_COOKIE = 'customer_auth_token';

export const createAuthTools = ({ secretKey, isProd }) => {
  if (!secretKey) {
    throw new Error('secretKey is required to initialize auth tools');
  }

  // Temporary migration flag: keep bearer fallback during token migration.
  // After one stable release cycle, set ENABLE_LEGACY_BEARER_FALLBACK=0 and remove fallback logic.
  const enableLegacyBearerFallback = String(process.env.ENABLE_LEGACY_BEARER_FALLBACK || '1') !== '0';

  const getCookieOptions = () => ({
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24
  });

  const parseCookies = (req) => {
    const header = String(req.headers?.cookie || '');
    if (!header) return {};
    return header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .reduce((acc, part) => {
        const idx = part.indexOf('=');
        if (idx <= 0) return acc;
        const key = decodeURIComponent(part.slice(0, idx).trim());
        const value = decodeURIComponent(part.slice(idx + 1).trim());
        acc[key] = value;
        return acc;
      }, {});
  };

  const getTokenFromRequest = (req, cookieName) => {
    const cookies = parseCookies(req);
    if (cookies[cookieName]) return cookies[cookieName];

    if (!enableLegacyBearerFallback) return null;

    const authHeader = String(req.headers?.authorization || '').trim();
    if (!authHeader) return null;
    const [scheme, token] = authHeader.split(/\s+/, 2);
    if (String(scheme || '').toLowerCase() !== 'bearer') return null;
    return String(token || '').trim() || null;
  };

  const getVerifiedUserFromRequest = (req, cookieName) => {
    const token = getTokenFromRequest(req, cookieName);
    if (!token) return null;
    try {
      return jwt.verify(token, secretKey);
    } catch {
      return null;
    }
  };

  const setAuthCookie = (res, cookieName, token, maxAgeMs = 1000 * 60 * 60 * 24) => {
    const options = { ...getCookieOptions(), maxAge: maxAgeMs };
    res.cookie(cookieName, token, options);
  };

  const clearAuthCookie = (res, cookieName) => {
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/'
    });
  };

  const authenticateToken = (req, res, next) => {
    const token = getTokenFromRequest(req, STAFF_AUTH_COOKIE);
    if (token == null) {
      return res.status(401).json({ error: 'Access Denied: No Token Provided' });
    }

    jwt.verify(token, secretKey, (err, user) => {
      if (err) return res.status(403).json({ error: 'Access Denied: Invalid Token' });
      if (user?.role === 'customer') {
        return res.status(403).json({ error: 'Access Denied: Staff Only' });
      }
      req.user = user;
      next();
    });
  };

  const authenticateCustomerToken = (req, res, next) => {
    const token = getTokenFromRequest(req, CUSTOMER_AUTH_COOKIE);
    if (token == null) {
      return res.status(401).json({ error: 'Access Denied: No Token Provided' });
    }

    jwt.verify(token, secretKey, (err, user) => {
      if (err) return res.status(403).json({ error: 'Access Denied: Invalid Token' });
      if (user?.role !== 'customer') {
        return res.status(403).json({ error: 'Access Denied: Customers Only' });
      }
      req.customer = user;
      next();
    });
  };

  const requireRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.sendStatus(403);
    }
    next();
  };

  return {
    getCookieOptions,
    parseCookies,
    getTokenFromRequest,
    getVerifiedUserFromRequest,
    setAuthCookie,
    clearAuthCookie,
    authenticateToken,
    authenticateCustomerToken,
    requireRoles
  };
};
