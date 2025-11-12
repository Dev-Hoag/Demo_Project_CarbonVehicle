// src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // CORS is handled by nginx gateway, so we don't enable it here
  // to avoid duplicate Access-Control-Allow-Origin headers
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Wallet Service API')
    .setDescription(
      'Carbon Credit Marketplace - Wallet Service\\n\\n' +
        'Manage fiat money wallets, deposits, withdrawals, and fund reservations.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-internal-api-key',
        in: 'header',
      },
      'internal-api-key',
    )
    .addTag('wallets', 'Wallet operations')
    .addTag('transactions', 'Transaction history')
    .addTag('withdrawals', 'Withdrawal requests')
    .addTag('internal-wallet', 'Internal APIs for other services')
    .addTag('health', 'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Wallet Service - API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('PORT', 3008);
  const host = configService.get<string>('HOST', '0.0.0.0');

  await app.listen(port, host);

  logger.log(`🚀 Wallet Service is running on: http://${host}:${port}`);
  logger.log(`📚 API Docs available at: http://localhost:${port}/api/docs`);
  logger.log(`💳 Managing wallets, deposits, withdrawals & fund reservations`);
}

bootstrap();
