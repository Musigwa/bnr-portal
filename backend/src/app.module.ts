import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt.auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { PrismaModule } from './database/prisma.module';
import { ApplicationsModule } from './domains/applications/applications.module';
import { AuditModule } from './domains/audit/audit.module';
import { AuthModule } from './domains/auth/auth.module';
import { DocumentsModule } from './domains/documents/documents.module';
import { UsersModule } from './domains/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ApplicationsModule,
    DocumentsModule,
    AuditModule,
  ],
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
