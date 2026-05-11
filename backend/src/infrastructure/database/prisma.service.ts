import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, PoolConfig } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  pool!: Pool;
  constructor() {
    const poolConfig: PoolConfig = {
      connectionString: process.env.DB_URL,
      min: 1,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
      allowExitOnIdle: true,
    };

    const pool = new Pool(poolConfig);

    const adapter = new PrismaPg(pool);
    super({
      adapter,
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    // Facilitate the ref number generation
    await this
      .$queryRaw`CREATE SEQUENCE IF NOT EXISTS application_ref_seq START 1`;
    Logger.log('Database connected successfully', 'PrismaService');
  }

  async onModuleDestroy() {
    Logger.log('Database disconnected', 'PrismaService');
    if (this.pool) await this.pool.end();
    await this.$disconnect();
  }
}
