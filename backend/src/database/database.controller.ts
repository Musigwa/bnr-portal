import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SeedService } from './seed/seed.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('database')
export class DatabaseController {
  constructor(private seedService: SeedService) {}

  @Post('seed')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  seed() {
    return this.seedService.seed();
  }

  @Post('reset')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  reset() {
    return this.seedService.reset();
  }
}
