import { createDbClient } from './dbClient.js';
import { applyCoreSchema } from './schema.js';
import { seedDatabase } from './seed.js';

export const initializeDatabase = ({
  db,
  isProd,
  saltRounds
}) => {
  const dbClient = createDbClient(db);
  Promise.resolve()
    .then(() => applyCoreSchema(dbClient))
    .then(() => seedDatabase({ dbClient, isProd, saltRounds }))
    .catch((error) => {
      console.error('❌ PostgreSQL initialization failed:', error.message);
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    });
};
