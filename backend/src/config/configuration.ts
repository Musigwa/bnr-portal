const configuration = () => ({
  app: {
    env: process.env.NODE_ENV,
    url: process.env.DOMAIN_ROOT
      ? `https://api.${process.env.APP_NAME ?? 'bnr-portal'}.${process.env.DOMAIN_ROOT}`
      : undefined,
    port: parseInt(process.env.BACKEND_PORT!, 10),
  },
  database: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN!,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtAccessExpirationMin: parseInt(
      process.env.JWT_ACCESS_EXPIRATION_MIN!,
      10,
    ),
    jwtRefreshExpirationDays: parseInt(
      process.env.JWT_REFRESH_EXPIRATION_DAYS!,
      10,
    ),
  },
  throttling: {
    ttlSec: parseInt(process.env.THROTTLE_TTL_SEC!, 10),
    limitReq: parseInt(process.env.THROTTLE_LIMIT_REQ!, 10),
    shortTtlSec: parseInt(process.env.THROTTLE_SHORT_TTL_SEC!, 10),
    shortLimitReq: parseInt(process.env.THROTTLE_SHORT_LIMIT_REQ!, 10),
    strictTtlSec: parseInt(process.env.THROTTLE_STRICT_TTL_SEC!, 10),
    strictLimitReq: parseInt(process.env.THROTTLE_STRICT_LIMIT_REQ!, 10),
  },
  documents: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB!, 10),
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT,
    port: parseInt(process.env.S3_PORT!, 10),
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucketName: process.env.S3_BUCKET_NAME,
    region: process.env.S3_REGION!,
    forcePathStyle:
      String(process.env.S3_FORCE_PATH_STYLE).toLowerCase() === 'true',
  },
});

export type Config = ReturnType<typeof configuration>;

// Generate dot-notation paths from the config type
type ConfigKeys<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends string | number | boolean | null | undefined
    ? `${Prefix}${K & string}` // Primitive values
    : T[K] extends unknown[]
      ? `${Prefix}${K & string}` // Arrays are leaf values
      : T[K] extends Record<string, unknown>
        ? ConfigKeys<T[K], `${Prefix}${K & string}.`> | `${Prefix}${K & string}` // Objects
        : never; // Functions and other non-serializable types
}[keyof T];

export type ConfigPath = ConfigKeys<Config>;

export default configuration;
