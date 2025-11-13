import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS is handled by nginx gateway, so we don't enable it here
  // to avoid duplicate Access-Control-Allow-Origin headers

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Payment Service API')
    .setDescription(
      'Carbon Credit Marketplace - Payment Service\n\n' +
        'Microservice xử lý thanh toán với VNPay, MoMo và các cổng khác',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-internal-api-key',
        in: 'header',
        description: 'Internal API key for service-to-service communication',
      },
      'internal-api-key',
    )
    .addTag('payments', 'Payment operations')
    .addTag('webhooks', 'Payment gateway webhooks')
    .addTag('internal-payment', 'Internal APIs for other services')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = configService.get<number>('PORT', 3007);
  await app.listen(port, '0.0.0.0');

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   💳 Payment Service Started!                            ║
║                                                           ║
║   📡 Port: ${port}                                       ║
║   📚 Swagger: http://localhost:${port}/api/docs          ║
║   🔥 Health: http://localhost:${port}/health             ║
║                                                           ║
║   🏦 VNPay: ${configService.get('VNPAY_TMN_CODE') ? '✅ Configured' : '❌ Not configured'}                        ║
║   🧪 Test Mode: ✅ Available                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();