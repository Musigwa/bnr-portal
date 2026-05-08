import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { DocumentsService } from './domains/documents/documents.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.get(DocumentsService).ensureUploadDir();

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
  app.enableShutdownHooks();

  await app.listen(process.env.PORT!);
}

bootstrap().catch((error) => {
  console.error('Application bootstrap failed:', error);
  process.exit(1);
});
