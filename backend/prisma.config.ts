import { defineConfig } from 'prisma/config';
import { generateDatabaseUrl } from './src/utils/db-url.generator';

const dbName = process.env.DB_NAME;

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: generateDatabaseUrl(),
    shadowDatabaseUrl: generateDatabaseUrl(`${dbName}_shadow`),
  },
});
