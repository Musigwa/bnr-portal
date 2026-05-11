import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { Logger } from '@nestjs/common';

export default async () => {
  // 1. Boot up the PostgreSQL container
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('bnr_portal_test')
    .withUsername('test_user')
    .withPassword('test_password')
    .start();

  // 2. Persist the container globally so teardown can stop it
  interface GlobalWithPostgres {
    __POSTGRES_CONTAINER__?: StartedPostgreSqlContainer;
  }
  (global as unknown as GlobalWithPostgres).__POSTGRES_CONTAINER__ = container;

  // 3. Construct the dynamic database URL
  const databaseUrl = container.getConnectionUri();

  // 4. Set the environment variables for Prisma and NestJS
  process.env.DB_URL = databaseUrl;
  process.env.DATABASE_URL = databaseUrl;
  process.env.DB_HOST = container.getHost();
  process.env.DB_PORT = container.getFirstMappedPort().toString();
  process.env.DB_USERNAME = 'test_user';
  process.env.DB_PASSWORD = 'test_password';
  process.env.DB_NAME = 'bnr_portal_test';

  // 5. Run Prisma Migrations programmatically against the ephemeral DB
  try {
    execSync('pnpm exec prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'ignore', // Suppress noisy migration logs
    });
  } catch (error) {
    Logger.error(
      '[Testcontainers] Failed to run migrations against ephemeral DB:',
      error instanceof Error ? error.stack : String(error),
      'JestSetup',
    );
    await container.stop();
    process.exit(1);
  }
};
