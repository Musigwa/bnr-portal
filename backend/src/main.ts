import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DocumentsService } from './domains/documents/documents.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  });

  app.get(DocumentsService).ensureUploadDir();

  await app.listen(process.env.PORT ?? 3001);
  console.log(
    `🚀 API running at http://localhost:${process.env.PORT ?? 3001}/api`,
  );
  console.log(
    `📖 Swagger docs at http://localhost:${process.env.PORT ?? 3001}/api/docs`,
  );
}
bootstrap().catch((error) => {
  console.error('Application bootstrap failed:', error);
  process.exit(1);
});
