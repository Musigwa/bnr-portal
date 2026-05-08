import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { generateDatabaseUrl } from '../utils/db-url.generator';
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
      connectionString: generateDatabaseUrl(),
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
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    console.log('❌ Database disconnected');
    if (this.pool) await this.pool.end();
    await this.$disconnect();
  }
}
