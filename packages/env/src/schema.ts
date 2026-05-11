import * as Joi from 'joi';

export const backendEnvSchema = Joi.object({
  // app config
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'staging', 'test')
    .required()
    .messages({
      'any.required':
        'NODE_ENV is required. Must be development, production, staging, or test.',
      'any.only':
        'NODE_ENV must be one of: development, production, staging, test',
    }),
  DOMAIN_ROOT: Joi.string().hostname().required().messages({
    'any.required':
      'DOMAIN_ROOT is strictly required (e.g., 212.47.77.2.nip.io or localhost)',
    'string.base': 'DOMAIN_ROOT must be a string',
    'string.hostname':
      'DOMAIN_ROOT must be a valid hostname (do NOT include http:// or https://)',
  }),

  BACKEND_PORT: Joi.number().port().required().messages({
    'any.required': 'BACKEND_PORT is required',
    'number.port': 'BACKEND_PORT must be a valid port number (1-65535)',
  }),

  // database
  DB_URL: Joi.string().uri().optional().messages({
    'string.uri':
      'DB_URL must be a valid connection URI (e.g., postgresql://...)',
  }),

  DB_HOST: Joi.string().when('DB_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required().messages({
      'any.required': 'DB_HOST is required if DB_URL is not provided',
    }),
  }),

  DB_PORT: Joi.number()
    .port()
    .when('DB_URL', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required().messages({
        'any.required': 'DB_PORT is required if DB_URL is not provided',
        'number.port': 'DB_PORT must be a valid port number (1-65535)',
      }),
    }),

  DB_USER: Joi.string().when('DB_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required().messages({
      'any.required': 'DB_USER is required if DB_URL is not provided',
    }),
  }),

  DB_NAME: Joi.string().when('DB_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required().messages({
      'any.required': 'DB_NAME is required if DB_URL is not provided',
    }),
  }),

  DB_PASSWORD: Joi.string().when('DB_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required().messages({
      'any.required':
        'DB_PASSWORD is strictly REQUIRED if DB_URL is not provided.',
    }),
  }),

  // security & jwt
  CORS_ORIGIN: Joi.string().default('*'),

  JWT_SECRET: Joi.string().required().messages({
    'any.required': 'JWT_SECRET is extremely critical and is required.',
  }),

  JWT_REFRESH_SECRET: Joi.string().required().messages({
    'any.required': 'JWT_REFRESH_SECRET is extremely critical and is required.',
  }),

  JWT_ACCESS_EXPIRATION_MIN: Joi.number().integer().positive().default(15),
  JWT_REFRESH_EXPIRATION_DAYS: Joi.number().integer().positive().default(7),

  // rate limiting
  THROTTLE_TTL_SEC: Joi.number().integer().positive().default(60),
  THROTTLE_LIMIT_REQ: Joi.number().integer().positive().default(200),

  THROTTLE_SHORT_TTL_SEC: Joi.number().integer().positive().default(1),
  THROTTLE_SHORT_LIMIT_REQ: Joi.number().integer().positive().default(10),

  THROTTLE_STRICT_TTL_SEC: Joi.number().integer().positive().default(60),
  THROTTLE_STRICT_LIMIT_REQ: Joi.number().integer().positive().default(5),

  // uploads
  MAX_FILE_SIZE_MB: Joi.number().integer().positive().default(5),

  // storage
  S3_ENDPOINT: Joi.string().required().messages({
    'any.required':
      'S3_ENDPOINT is required (e.g., localhost or AWS S3 endpoint)',
  }),

  S3_BUCKET_NAME: Joi.string().required().messages({
    'any.required': 'S3_BUCKET_NAME is required',
  }),

  S3_PORT: Joi.number().port().default(9000),

  S3_ACCESS_KEY: Joi.string().required().messages({
    'any.required': 'S3_ACCESS_KEY is required',
  }),

  S3_SECRET_KEY: Joi.string().required().messages({
    'any.required': 'S3_SECRET_KEY is required',
  }),

  S3_REGION: Joi.string().default('us-east-1'),

  S3_CONSOLE_PORT: Joi.number().port().default(9001),

  S3_FORCE_PATH_STYLE: Joi.boolean().default(true),
})
  .or('DB_URL', 'DB_HOST')
  .custom((value: Record<string, unknown>, helpers) => {
    const errors: string[] = [];

    // custom validation: ensure DB_URL matches individual DB_* variables if both exist
    if (value.DB_URL) {
      try {
        const url = new URL(value.DB_URL as string);
        const urlUsername = decodeURIComponent(url.username);
        const urlPassword = decodeURIComponent(url.password);
        const urlHost = url.hostname;
        const urlPort = url.port;
        const urlDatabase = url.pathname.slice(1).split('?')[0];

        if (value.DB_USER && urlUsername !== value.DB_USER) {
          errors.push(
            `DB_URL username (${urlUsername}) doesn't match DB_USER (${value.DB_USER as string})`,
          );
        }

        if (value.DB_PASSWORD && urlPassword !== value.DB_PASSWORD) {
          errors.push("DB_URL password doesn't match DB_PASSWORD");
        }

        if (value.DB_HOST && urlHost !== value.DB_HOST) {
          errors.push(
            `DB_URL host (${urlHost}) doesn't match DB_HOST (${value.DB_HOST as string})`,
          );
        }

        const dbPortStr = String(value.DB_PORT);
        if (value.DB_PORT && urlPort !== dbPortStr) {
          errors.push(
            `DB_URL port (${urlPort}) doesn't match DB_PORT (${dbPortStr})`,
          );
        }

        if (value.DB_NAME && urlDatabase !== value.DB_NAME) {
          errors.push(
            `DB_URL database (${urlDatabase}) doesn't match DB_NAME (${value.DB_NAME as string})`,
          );
        }
      } catch {
        // invalid urls caught by uri() earlier
      }
    }

    if (errors.length > 0) {
      return helpers.message({ custom: errors.join('. ') });
    }

    // Auto-compute DB_URL if missing
    if (
      !value.DB_URL &&
      value.DB_HOST &&
      value.DB_PORT &&
      value.DB_USER &&
      value.DB_PASSWORD &&
      value.DB_NAME
    ) {
      const urlUsername = encodeURIComponent(String(value.DB_USER));
      const urlPassword = encodeURIComponent(String(value.DB_PASSWORD));
      value.DB_URL = `postgresql://${urlUsername}:${urlPassword}@${value.DB_HOST}:${value.DB_PORT}/${value.DB_NAME}`;
    }

    return value;
  });

export const frontendEnvSchema = Joi.object({
  NEXT_FRONTEND_PORT: Joi.number().port().default(3000).messages({
    'number.port': 'NEXT_FRONTEND_PORT must be a valid port number',
  }),
  NEXT_PUBLIC_API_URL: Joi.string().uri().required().messages({
    'any.required':
      'NEXT_PUBLIC_API_URL is required for the frontend to communicate with the backend.',
    'string.uri': 'NEXT_PUBLIC_API_URL must be a valid URL',
  }),
});

// A combined schema strictly used by the CLI wizard to generate the full .env file
export const combinedEnvSchema = backendEnvSchema.concat(frontendEnvSchema);

// Shared validation logic to strip empty strings and validate
export function validateEnvironment(
  env: Record<string, unknown>,
  schema: Joi.ObjectSchema,
): Record<string, unknown> {
  const envToValidate = { ...env };

  // Strip empty strings so Joi treats them as genuinely omitted
  for (const key of Object.keys(envToValidate)) {
    if (envToValidate[key] === '') {
      delete envToValidate[key];
    }
  }

  const { error, value } = schema.validate(envToValidate, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    console.error('Environment validation FAILED!');
    error.details.forEach((err) => {
      console.error(`- ${err.message}`);
    });
    throw new Error(
      `Environment validation failed. See logs above for details.`,
    );
  }

  return value;
}
