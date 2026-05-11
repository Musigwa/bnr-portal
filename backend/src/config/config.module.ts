import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import configuration from './configuration';
import { backendEnvSchema, validateEnvironment } from '@bnr-portal/env';

import { AppConfigService } from './config.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // In Docker, skip .env file and use only environment variables
      ignoreEnvFile: String(process.env.CONTAINER_ENV).toLowerCase() === 'true',
      envFilePath: join(process.cwd(), `../.env.${process.env.NODE_ENV}`),
      load: [configuration],
      validate: (env) => validateEnvironment(env, backendEnvSchema),
      expandVariables: true,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
