import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

const parseBoolean = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const buildPostgresConfig = () => {
  const connectionString = String(process.env.DATABASE_URL || '').trim();
  const host = String(process.env.PGHOST || '127.0.0.1').trim();
  const port = Number(process.env.PGPORT || 5432);
  const user = String(process.env.PGUSER || '').trim();
  const password = String(process.env.PGPASSWORD || '').trim();
  const database = String(process.env.PGDATABASE || '').trim();
  const sslEnabled = parseBoolean(process.env.PG_SSL);
  const sslRejectUnauthorized = parseBoolean(process.env.PG_SSL_REJECT_UNAUTHORIZED);
  const requestedMax = Math.max(1, Number(process.env.PG_POOL_MAX) || 1);
  const max = 1;

  if (requestedMax !== 1) {
    console.warn('⚠️ PG_POOL_MAX is forced to 1 to preserve transaction semantics with the current repository pattern.');
  }

  if (connectionString) {
    return {
      connectionString,
      max,
      ssl: sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : false
    };
  }

  return {
    host,
    port,
    user,
    password,
    database,
    max,
    ssl: sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : false
  };
};

const createPostgresConnection = () => {
  const config = buildPostgresConfig();
  const pool = new Pool(config);

  pool
    .query('SELECT 1')
    .then(() => {
      const target = config.connectionString
        ? 'DATABASE_URL'
        : `${config.host}:${config.port}/${config.database || '(default db)'}`;
      console.log(`✅ PostgreSQL connected: ${target}`);
    })
    .catch((error) => {
      console.error('❌ Failed to connect to PostgreSQL:', error.message);
    });

  return pool;
};

export const db = createPostgresConnection();

export const closeDb = () => db.end();

export default db;
