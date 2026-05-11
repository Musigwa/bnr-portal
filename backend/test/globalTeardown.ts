import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export default async () => {
  interface GlobalWithPostgres {
    __POSTGRES_CONTAINER__?: StartedPostgreSqlContainer;
  }
  const container = (global as unknown as GlobalWithPostgres)
    .__POSTGRES_CONTAINER__;

  if (container) {
    await container.stop();
  }
};
