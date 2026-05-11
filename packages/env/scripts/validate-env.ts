import { combinedEnvSchema, validateEnvironment } from '../src/schema';
import * as dotenvx from '@dotenvx/dotenvx';
import * as fs from 'fs';
import * as path from 'path';

function verifyTurboConfiguration() {
  const rootPath = path.resolve(__dirname, '../../../');
  const turboJsonPath = path.resolve(rootPath, 'turbo.json');

  if (!fs.existsSync(turboJsonPath)) {
    console.warn('turbo.json not found. Skipping static turborepo validation.');
    return;
  }

  const turboJson = JSON.parse(fs.readFileSync(turboJsonPath, 'utf8'));
  const globalEnv: string[] = turboJson.globalEnv || [];

  const schemaKeys = Object.keys(combinedEnvSchema.describe().keys || {});
  const missingKeys: string[] = [];

  for (const key of schemaKeys) {
    const isCovered = globalEnv.some((envPattern) => {
      if (envPattern.endsWith('*')) {
        const prefix = envPattern.slice(0, -1);
        return key.startsWith(prefix);
      }
      return key === envPattern;
    });

    if (!isCovered) {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    console.error(`\nERROR: Environment Variables missing from turbo.json!`);
    console.error(
      `The following variables are defined in your Joi schema, but not allowed through Turborepo's strict mode sandbox:\n`,
    );
    missingKeys.forEach((k) => console.error(`   - ${k}`));
    console.error(
      `\nPlease add them (or a matching wildcard) to the 'globalEnv' array in turbo.json.\n`,
    );
    process.exit(1);
  }

  console.log('turbo.json globalEnv perfectly matches the environment schema.');
}

// Define expected error structure from Joi

async function validateEnv() {
  const args = process.argv.slice(2);
  const isTurboOnly = args.includes('--turbo-only');

  if (!isTurboOnly && args.length > 0 && args[0] !== '--turbo-only') {
    const cwd = process.env.INIT_CWD || process.cwd();
    const envFile = path.resolve(cwd, args[0]);
    if (!fs.existsSync(envFile)) {
      console.error(`Error: Environment file not found at ${envFile}`);
      process.exit(1);
    }
    console.log(`Loading and validating ${args[0]} against Joi schema...`);
    dotenvx.config({ path: envFile });
  } else if (!isTurboOnly) {
    console.log('Validating system process.env against Joi schema...');
  }

  verifyTurboConfiguration();

  if (isTurboOnly) {
    console.log(
      'Skipping runtime Joi validation (--turbo-only flag provided).',
    );
    process.exit(0);
  }

  try {
    validateEnvironment(process.env, combinedEnvSchema);
    console.log('Environment validation PASSED. Safe to deploy/boot.');
    process.exit(0);
  } catch (error: unknown) {
    process.exit(1);
  }
}

validateEnv().catch((error: unknown) => {
  console.error('Fatal execution error:', error);
  process.exit(1);
});
