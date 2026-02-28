import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const buildCorsOriginChecker = (corsOrigins = [], { isProd = false } = {}) => {
  const allowed = new Set((corsOrigins || []).filter(Boolean));
  return (origin, callback) => {
    // In development, allow any browser origin to support public tunnel/port-forward URLs.
    // Production remains strict and only allows configured origins.
    if (!isProd) {
      return callback(null, true);
    }

    if (!origin || allowed.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  };
};

export const applySecurityMiddleware = (app, { corsOrigins, isProd }) => {
  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );

  app.use(
    cors({
      origin: buildCorsOriginChecker(corsOrigins, { isProd }),
      credentials: true
    })
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: isProd ? 1200 : 5000,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
};

export const createAuthRateLimiter = ({ isProd }) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 20 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' }
  });
