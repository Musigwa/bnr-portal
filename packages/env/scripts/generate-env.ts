import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import { combinedEnvSchema, validateEnvironment } from '../src/schema';

// --- ANSI Colors ---
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

interface JoiFieldDescription {
  type: string;
  flags?: {
    presence?: string;
    default?: string | number | boolean;
  };
  whens?: Array<unknown>;
}

function generateSecret(length = 24) {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*-_=+';
  let secret = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    secret += charset[bytes[i] % charset.length];
  }
  return secret;
}

async function promptTargetEnvironment(): Promise<{
  targetEnv: string;
  isSilent: boolean;
}> {
  console.log('Select target environment:');
  console.log(`  ${colors.green}1)${colors.reset} development`);
  console.log(`  ${colors.green}2)${colors.reset} staging`);
  console.log(`  ${colors.green}3)${colors.reset} production`);
  console.log(`  ${colors.green}4)${colors.reset} test`);
  console.log(`  ${colors.green}5)${colors.reset} example (Silent generation)`);

  const envInput = await question('Choose [1]: ');

  switch (envInput.trim()) {
    case '2':
      return { targetEnv: 'staging', isSilent: false };
    case '3':
      return { targetEnv: 'production', isSilent: false };
    case '4':
      return { targetEnv: 'test', isSilent: false };
    case '5':
      return { targetEnv: 'example', isSilent: true };
    default:
      return { targetEnv: 'development', isSilent: false };
  }
}

function buildComment(field: JoiFieldDescription, isRequired: boolean): string {
  const comments = [
    `Type: ${field.type}`,
    isRequired ? 'REQUIRED' : 'OPTIONAL',
  ];
  if (field.flags?.default !== undefined) {
    comments.push(`Default: ${field.flags.default}`);
  }
  return `# ${comments.join(' | ')}\n`;
}

async function processInteractiveInput(
  key: string,
  field: JoiFieldDescription,
  isRequired: boolean,
  envState: Record<string, string>,
): Promise<string> {
  const defaultValue = field.flags?.default;
  const isSecret = ['SECRET', 'PASSWORD', 'KEY', 'TOKEN'].some((keyword) =>
    key.toUpperCase().includes(keyword.toUpperCase()),
  );
  let isValid = false;
  let finalValue = '';

  console.log(`${colors.cyan}[${key}]${colors.reset}`);

  while (!isValid) {
    let testValue: string | undefined = undefined;

    if (isSecret) {
      console.log(
        `  This looks like a secret. Do you want to auto-generate a secure random string?`,
      );
      const genInput = await question(
        `  ${colors.green}Generate? [Y/n]: ${colors.reset}`,
      );
      if (genInput.trim().toLowerCase() !== 'n') {
        testValue = generateSecret();
        console.log(`  ${colors.yellow}Generated: ${testValue}${colors.reset}`);
      } else {
        const manualInput = await question(`  Value: `);
        testValue =
          manualInput.trim() !== ''
            ? manualInput.trim()
            : defaultValue !== undefined
              ? String(defaultValue)
              : undefined;
      }
    } else {
      const promptText =
        defaultValue !== undefined
          ? `  Value (default: ${colors.yellow}${defaultValue}${colors.reset}): `
          : `  Value${isRequired ? ` (${colors.yellow}required${colors.reset})` : ''}: `;

      const userInput = await question(promptText);
      testValue =
        userInput.trim() !== ''
          ? userInput.trim()
          : defaultValue !== undefined
            ? String(defaultValue)
            : undefined;
    }

    // Delegate ALL validation to Joi
    const tempState = { ...envState, [key]: testValue };
    const result = combinedEnvSchema.validate(tempState, {
      abortEarly: false,
      allowUnknown: true,
    });
    const keyError = result.error?.details.find(
      (d) => String(d.path[0]) === key,
    );

    if (keyError) {
      console.log(
        `  ${colors.magenta}Error: ${keyError.message}${colors.reset}`,
      );
    } else {
      finalValue = testValue ?? '';
      isValid = true;
    }
  }

  console.log();
  return finalValue;
}

async function handleOutputActions(
  outputString: string,
  targetEnv: string,
  targetPath: string,
) {
  console.log(
    `\n${colors.cyan}What would you like to do with these generated variables?${colors.reset}`,
  );
  console.log(
    `  ${colors.green}1)${colors.reset} Save to local file (${colors.yellow}${path.basename(targetPath)}${colors.reset})`,
  );
  console.log(`  ${colors.green}2)${colors.reset} Upload to GitHub Secrets`);
  console.log(`  ${colors.green}3)${colors.reset} Both`);

  const actionInput = await question(`Choose [1]: `);
  const action = actionInput.trim() || '1';

  const shouldSave = action === '1' || action === '3';
  const shouldUpload = action === '2' || action === '3';

  if (shouldSave) {
    fs.writeFileSync(targetPath, outputString.trimEnd() + '\n', 'utf8');
    console.log(
      `\n${colors.green}Successfully saved ${targetPath}${colors.reset}`,
    );
  }

  if (shouldUpload) {
    console.log(
      `\n${colors.cyan}Where should the secrets be uploaded?${colors.reset}`,
    );
    console.log(
      `  ${colors.green}1)${colors.reset} Deployment environment (${colors.yellow}${targetEnv}${colors.reset})`,
    );
    console.log(`  ${colors.green}2)${colors.reset} Repository-level`);

    const envUploadInput = await question(`Choose [1]: `);
    const envUploadAction = envUploadInput.trim() || '1';

    const envFlag = envUploadAction === '1' ? `-e ${targetEnv} ` : '';

    try {
      console.log(
        `\n${colors.yellow}Uploading secrets to GitHub...${colors.reset}`,
      );
      execSync(`gh secret set ${envFlag}-f -`, {
        input: outputString.trimEnd() + '\n',
        stdio: ['pipe', 'inherit', 'pipe'],
      });
      console.log(
        `\n${colors.green}Successfully uploaded secrets to GitHub!${colors.reset}`,
      );
    } catch (error: any) {
      const stderr = error.stderr ? error.stderr.toString() : '';
      if (stderr.includes('404') && envUploadAction === '1') {
        console.log(
          `\n  ${colors.yellow}Environment "${targetEnv}" not found. Creating it on the fly...${colors.reset}`,
        );
        try {
          execSync(
            `gh api -X PUT repos/:owner/:repo/environments/${targetEnv}`,
            { stdio: 'ignore' },
          );
          console.log(
            `  ${colors.green}Environment created. Retrying upload...${colors.reset}`,
          );
          execSync(`gh secret set ${envFlag}-f -`, {
            input: outputString.trimEnd() + '\n',
            stdio: ['pipe', 'inherit', 'pipe'],
          });
          console.log(
            `\n${colors.green}Successfully uploaded secrets to GitHub!${colors.reset}`,
          );
        } catch (retryError: any) {
          console.log(
            `\n${colors.magenta}Failed to automatically create the environment or upload secrets.${colors.reset}`,
          );
        }
      } else if (stderr) {
        console.log(
          `\n${colors.magenta}GitHub CLI Error:\n${stderr.trim()}${colors.reset}`,
        );
      } else {
        console.log(
          `\n${colors.magenta}Failed to upload secrets. Make sure the GitHub CLI (gh) is installed and authenticated.${colors.reset}`,
        );
      }
    }
  }
}

async function main() {
  console.log(
    `\n${colors.bold}${colors.cyan}=========================================${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}     Environment Setup Wizard${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.cyan}=========================================${colors.reset}\n`,
  );

  const { targetEnv, isSilent } = await promptTargetEnvironment();

  const schemaDesc = combinedEnvSchema.describe();
  const keys = schemaDesc.keys as
    | Record<string, JoiFieldDescription>
    | undefined;

  if (!keys) {
    console.error('Failed to parse Joi schema.');
    process.exit(1);
  }

  let output = `# AUTO-GENERATED ENVIRONMENT VARIABLES (${targetEnv.toUpperCase()})\n\n`;
  const envState: Record<string, string> = {};

  if (!isSilent) {
    console.log(
      `\n${colors.magenta}⚙ Generating ${targetEnv === 'development' ? '.env' : `.env.${targetEnv}`}...${colors.reset}\n`,
    );
    await question('Press Enter to begin configuration...');
    console.log('\n');
  }

  for (const [key, field] of Object.entries(keys)) {
    let isRequired = field.flags?.presence === 'required';
    if (
      ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].includes(
        key,
      ) &&
      !envState['DB_URL']
    ) {
      isRequired = true;
    }

    // Smart Auto-computation (Suggestion)
    if (key === 'NEXT_PUBLIC_API_URL') {
      const domainRoot = envState['DOMAIN_ROOT'] || 'localhost';
      const backendPort = envState['BACKEND_PORT'] || '3002';

      const computedUrl =
        targetEnv === 'development' || domainRoot === 'localhost'
          ? `http://${domainRoot}:${backendPort}`
          : `https://api.bnr-portal.${domainRoot}`;

      console.log(
        `  ${colors.cyan}💡 Auto-computed suggestion from your DOMAIN_ROOT & BACKEND_PORT${colors.reset}`,
      );

      field.flags = field.flags || {};
      field.flags.default = computedUrl;
    }

    output += buildComment(field, isRequired);

    if (isSilent) {
      if (key === 'NODE_ENV') {
        output += `${key}=development\n\n`;
        envState[key] = 'development';
      } else {
        const val =
          field.flags?.default !== undefined ? String(field.flags.default) : '';
        output += `${key}=${val}\n\n`;
        if (val !== '') {
          envState[key] = val;
        } else {
          delete envState[key];
        }
      }
      continue;
    }

    if (key === 'NODE_ENV') {
      output += `${key}=${targetEnv}\n\n`;
      envState[key] = targetEnv;
      continue;
    }

    const finalValue = await processInteractiveInput(
      key,
      field,
      isRequired,
      envState,
    );
    output += `${key}=${finalValue}\n\n`;

    if (finalValue !== '') {
      envState[key] = finalValue;
    } else {
      delete envState[key];
    }
  }

  console.log(
    `\n${colors.cyan}Performing final strict validation...${colors.reset}`,
  );
  let validatedEnv: Record<string, string>;
  try {
    validatedEnv = validateEnvironment(envState, combinedEnvSchema) as Record<
      string,
      string
    >;
    console.log(
      `  ${colors.green}✓ Validation PASSED. Environment is strictly compliant.${colors.reset}`,
    );
  } catch (error: unknown) {
    console.log(
      `\n${colors.yellow}The file/upload has been aborted. Please restart the wizard and correct these issues.${colors.reset}`,
    );
    rl.close();
    process.exit(1);
  }

  // Harness the schema's wisdom: apply any auto-computed or defaulted values back to the output
  for (const key of Object.keys(validatedEnv)) {
    const val = validatedEnv[key];
    if (val && !output.includes(`${key}=`)) {
      output += `# AUTO-COMPUTED BY SCHEMA\n${key}=${val}\n\n`;
    } else if (val && envState[key] !== val) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      output = output.replace(regex, `${key}=${val}`);
    }
  }

  const rootPath = process.env.INIT_CWD || process.cwd();
  const fileName = targetEnv === 'development' ? '.env' : `.env.${targetEnv}`;
  const targetPath = path.join(rootPath, fileName);

  if (isSilent) {
    fs.writeFileSync(targetPath, output.trimEnd() + '\n', 'utf8');
    console.log(
      `\n${colors.green}Successfully generated ${targetPath} from Joi schema.${colors.reset}`,
    );
  } else {
    await handleOutputActions(output, targetEnv, targetPath);
  }

  rl.close();
}

main().catch(console.error);
