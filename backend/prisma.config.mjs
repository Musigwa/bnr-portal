// @ts-check

/**
 * @type {import('prisma/config').PrismaConfig}
 */
export default {
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DB_URL,
    shadowDatabaseUrl: process.env.DB_URL
      ? (() => {
          try {
            const url = new URL(process.env.DB_URL);
            if (url.pathname && url.pathname !== '/') {
              url.pathname = `${url.pathname}_shadow`;
              return url.toString();
            }
            return undefined;
          } catch {
            return undefined;
          }
        })()
      : undefined,
  },
};
