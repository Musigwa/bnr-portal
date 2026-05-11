import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/config.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt.auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { ApplicationsModule } from './domains/applications/applications.module';
import { AuditModule } from './domains/audit/audit.module';
import { AuthModule } from './domains/auth/auth.module';
import { DocumentsModule } from './domains/documents/documents.module';
import { UsersModule } from './domains/users/users.module';
import { AppController } from './app.controller';
import { PrismaModule } from './infrastructure/database/prisma.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => [
        {
          name: 'short',
          ttl: config.get<number>('throttling.shortTtlSec') * 1000,
          limit: config.get<number>('throttling.shortLimitReq'),
        },
        {
          name: 'long',
          ttl: config.get<number>('throttling.ttlSec') * 1000,
          limit: config.get<number>('throttling.limitReq'),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ApplicationsModule,
    DocumentsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
