import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config, ConfigPath } from './configuration';

@Injectable()
export class AppConfigService extends ConfigService<Config, true> {
  override get<T = unknown>(propertyPath: ConfigPath): T {
    return super.get(propertyPath, { infer: true });
  }

  override getOrThrow<T = unknown>(propertyPath: ConfigPath): T {
    return super.getOrThrow(propertyPath, { infer: true });
  }
}
