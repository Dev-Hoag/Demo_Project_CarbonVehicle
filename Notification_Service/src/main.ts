// import * as crypto from 'crypto';

// Make crypto globally available for TypeORM
// (global as any).crypto = crypto;

import * as crypto from 'crypto';

// Make crypto globally available for TypeORM
(global as any).crypto = crypto;

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    cors: true, // Enable CORS for WebSocket
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3010;

  // Enable CORS for HTTP and WebSocket
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  logger.log(`🚀 Notification Service is running on http://localhost:${port}`);
  logger.log(`📬 RabbitMQ consumers are active`);
  logger.log(`🔥 Firebase Cloud Messaging is ready`);
  logger.log(`🔌 WebSocket Gateway is ready on ws://localhost:${port}/notifications`);
}

bootstrap();
