import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SeedService } from './seed/seed.service';
import { DatabaseController } from './database.controller';

@Global()
@Module({
  controllers: [DatabaseController],
  providers: [PrismaService, SeedService],
  exports: [PrismaService, SeedService],
})
export class PrismaModule {}
