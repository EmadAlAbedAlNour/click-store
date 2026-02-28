import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const [{ default: app }, { db, closeDb }] = await Promise.all([
  import('./app.js'),
  import('./db/connection.js')
]);

const PORT = Number(process.env.PORT) || 5000;
const HOST = String(process.env.HOST || '0.0.0.0').trim() || '0.0.0.0';
let server = null;

const shutdown = (signal) => {
  console.log(`\n${signal} received. Closing server...`);

  if (!server) {
    closeDb()
      .then(() => {
        console.log('✅ Database connection closed.');
        process.exit(0);
      })
      .catch((dbError) => {
        console.error('❌ Error while closing database connection:', dbError.message);
        process.exit(1);
      });
    return;
  }

  server.close(() => {
    closeDb()
      .then(() => {
        console.log('✅ Database connection closed.');
        process.exit(0);
      })
      .catch((dbError) => {
        console.error('❌ Error while closing database connection:', dbError.message);
        process.exit(1);
      });
  });
};

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server is running on ${HOST}:${PORT}`);
  });

  server.on('error', (error) => {
    if (error?.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Stop the running process or use a different PORT.`);
      process.exit(1);
      return;
    }

    console.error('❌ Server startup error:', error);
    process.exit(1);
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export { app, db, server, closeDb };
