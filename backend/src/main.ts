import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DocumentsService } from './domains/documents/documents.service';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appUrl = process.env.APP_URL;
  const isHttps = appUrl?.startsWith('https://');

  app.use(
    helmet({
      hsts: isHttps ? undefined : false,
      crossOriginOpenerPolicy: isHttps ? { policy: 'same-origin' } : false,
      crossOriginResourcePolicy: isHttps ? { policy: 'same-origin' } : false,
      crossOriginEmbedderPolicy: isHttps ? undefined : false,
      contentSecurityPolicy: isHttps
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:', 'validator.swagger.io'],
            },
          }
        : false,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('api');
  app.enableCors();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('BNR Bank Licensing & Compliance Portal')
    .setDescription(
      'API for managing bank licensing applications, documents, and compliance workflows',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'BNR Bank Licensing & Compliance Portal',
  });

  app.get(DocumentsService).ensureUploadDir();

  const PORT = parseInt(process.env.PORT!, 10);

  await app.listen(PORT);
  console.log(`🚀 API running at http://localhost:${PORT}/api`);
  console.log(`📖 Swagger docs at http://localhost:${PORT}/api/docs`);
}
bootstrap().catch((error) => {
  console.error('Application bootstrap failed:', error);
  process.exit(1);
});
