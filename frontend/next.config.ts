import type { NextConfig } from 'next';
import { frontendEnvSchema, validateEnvironment } from '@bnr-portal/env';

// Validate environment variables strictly at build/boot time using the shared helper
try {
  validateEnvironment(process.env, frontendEnvSchema);
} catch {
  process.exit(1);
}

const nextConfig: NextConfig = {
  // Turborepo handles isolation, standalone output is redundant
};

export default nextConfig;
