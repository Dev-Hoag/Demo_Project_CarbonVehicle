import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.use(express.urlencoded({ extended: true }));

  // -------- Public docs (/api/docs)
  const publicCfg = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('Auth, User, KYC')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const publicDoc = SwaggerModule.createDocument(app, publicCfg);
  SwaggerModule.setup('/api/docs', app, publicDoc, {
    customSiteTitle: 'User Service — Public Docs',
  });

  // -------- Internal docs (/api/docs-internal) chỉ bật local/dev
  const internalEnabled = process.env.INTERNAL_SWAGGER === 'true';
  if (internalEnabled) {
    const internalCfg = new DocumentBuilder()
      .setTitle('User Service Internal API')
      .setDescription('Internal-only endpoints')
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', name: 'x-internal-secret', in: 'header' }, 'internalApi')
      .build();
    const internalDoc = SwaggerModule.createDocument(app, internalCfg);
    SwaggerModule.setup('/api/docs-internal', app, internalDoc, {
      swaggerOptions: { persistAuthorization: true },
      customSiteTitle: 'User Service — Internal Docs',
    });
  }

  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || 3001);

  await app.listen(port, host);

  // ---- Print URLs ngay khi start
  const baseUrl = (await app.getUrl()).replace('[::1]', 'localhost');
  const publicUrl = `${baseUrl}/api/docs`;
  logger.log(` Swagger (public): ${publicUrl}`);

  if (internalEnabled) {
    const internalUrl = `${baseUrl}/api/docs-internal`;
    logger.log(` Swagger (internal): ${internalUrl}`);
  }

  logger.log(` User Service running at ${baseUrl}`);
}
bootstrap();
