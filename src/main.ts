// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  BadRequestException,
  Logger,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Catch,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';

function parseOrigins(raw?: string): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
function isLocalhostOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

/** Global exception filter: log đầy đủ lỗi + trả traceId để đối chiếu log */
@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception?.message ?? 'Unknown error';

    const traceId =
      (req.headers['x-request-id'] as string) ??
      Math.random().toString(36).slice(2);

    this.logger.error(
      `traceId=${traceId} ${req.method} ${req.url} origin=${req.headers.origin ?? '-'
      }`,
      exception?.stack ||
        (typeof payload === 'string' ? payload : JSON.stringify(payload)),
    );
    this.logger.debug(`body=${JSON.stringify(req.body)}`);

    res.status(status).json({
      statusCode: status,
      message:
        typeof payload === 'string'
          ? payload
          : (payload as any)?.message ?? 'Error',
      errors: typeof payload === 'object' ? payload : undefined,
      traceId,
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);

  const PORT = Number(process.env.APP_PORT ?? 3000);
  const NODE_ENV = process.env.NODE_ENV ?? 'development';
  const isProd = NODE_ENV === 'production';

  // ---- Cookies ----
  app.use(cookieParser());

  // ---- CORS (whitelist + cookie) ----
  // Set qua ENV, ví dụ:
  // CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
  const allowlist = new Set(parseOrigins(process.env.CORS_ORIGINS));

  app.enableCors({
    origin: (origin, cb) => {
      // Cho phép tool không gửi Origin (curl/Postman/SSR)
      if (!origin) return cb(null, true);

      // Trong prod: chỉ allow khi nằm trong allowlist
      if (isProd) {
        if (allowlist.has(origin)) return cb(null, true);
        // Nếu bạn test Swagger ngay trên cùng host:port
        if (origin === `http://localhost:${PORT}` || origin === `http://127.0.0.1:${PORT}`) {
          return cb(null, true);
        }
        return cb(new Error('Not allowed by CORS'));
      }

      // Dev: allow nếu nằm trong allowlist hoặc là localhost/127.* bất kỳ port
      if (allowlist.has(origin) || isLocalhostOrigin(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true, // BẮT BUỘC nếu dùng cookie/withCredentials từ FE
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Disposition'],
    optionsSuccessStatus: 204,
  });

  // ---- Helmet ----
  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false, // Swagger dev
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ---- Validation (log chi tiết lỗi validate) ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const details = errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
        }));
        return new BadRequestException({
          message: 'Validation failed',
          details,
        });
      },
    }),
  );

  // ---- Global exception filter ----
  app.useGlobalFilters(new AllExceptionsFilter());

  // ---- Swagger ----
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Admin Service API')
    .setDescription('API docs for Carbon Credit Marketplace Admin')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  // Swagger UI path: /api
  SwaggerModule.setup('api', app, doc, {
    customSiteTitle: 'Admin Service Swagger',
  });

  // (Tuỳ chọn) Log origin mỗi request để debug CORS nhanh
  if (process.env.LOG_ORIGIN === 'true') {
    app.use((req, _res, next) => {
      // eslint-disable-next-line no-console
      console.log('Origin:', req.headers.origin ?? '-', 'Path:', req.path);
      next();
    });
  }

  await app.listen(PORT, '0.0.0.0'); // quan trọng cho Docker
}

bootstrap();
