const configuration = () => ({
  app: {
    env: process.env.NODE_ENV,
    url: process.env.BACKEND_URL,
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
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
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
