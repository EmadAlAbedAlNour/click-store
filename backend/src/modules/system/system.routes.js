export const registerSystemRoutes = ({ app }) => {
  const healthPayload = () => ({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });

  app.get('/health', (req, res) => {
    res.json(healthPayload());
  });

  app.get('/api/health', (req, res) => {
    res.json(healthPayload());
  });
};
