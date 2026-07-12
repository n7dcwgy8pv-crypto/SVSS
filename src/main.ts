import * as dotenv from 'dotenv';
dotenv.config();

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionFilter } from 'src/libs/helper/exception-filter';
import * as fs from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ensure uploads directory exists
  const uploadDir = process.env.LOCAL_UPLOAD_DIR
    ? join(process.cwd(), process.env.LOCAL_UPLOAD_DIR)
    : join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const adapter = app.get(HttpAdapterHost).httpAdapter;
  app.useGlobalFilters(new AllExceptionFilter(adapter));

  const config = new DocumentBuilder()
    .setTitle('SVSS API')
    .setDescription('Smart Venue Security System — API documentation')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 8000;
  await app.listen(port);
  Logger.log(`Application running on: http://localhost:${port}`);
  Logger.log(`Swagger docs: http://localhost:${port}/api-docs`);

  app.enableShutdownHooks();
}

void bootstrap();
