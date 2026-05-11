import 'dotenv/config';
export const generateDatabaseUrl = (dbNameOverride?: string): string => {
  if (process.env.DB_URL && !dbNameOverride) {
    return process.env.DB_URL;
  }

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const dbName = dbNameOverride || process.env.DB_NAME;
  const ssl = process.env.DB_SSL === 'true';

  if (host && user && password && dbName) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    const sslMode = ssl ? '?sslmode=require' : '';
    return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${dbName}${sslMode}`;
  }
  return '';
};
