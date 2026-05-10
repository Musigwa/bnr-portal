import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SeedService } from './seed/seed.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('database')
@ApiBearerAuth('access-token')
@Controller('database')
export class DatabaseController {
  constructor(private seedService: SeedService) {}

  @ApiOperation({ summary: 'Seed database' })
  @Post('seed')
  @Public()
  @HttpCode(HttpStatus.OK)
  seed() {
    return this.seedService.seed();
  }

  @ApiOperation({ summary: 'Reset database' })
  @Post('reset')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  reset() {
    return this.seedService.reset();
  }
}
