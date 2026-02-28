const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    console.error(err?.stack || err);
  }

  const statusCode = Number(err?.status) || 500;
  const message = String(err?.error || err?.message || 'Internal Server Error');

  return res.status(statusCode).json({ error: message });
};

export default errorMiddleware;
