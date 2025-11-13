import {
  ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const resp = exception instanceof HttpException
      ? exception.getResponse()
      : exception?.message ?? 'Unknown error';

    const traceId = (req.headers['x-request-id'] as string) || randomUUID();

    // LOG đầy đủ vào stdout -> docker logs sẽ thấy
    this.logger.error(
      `traceId=${traceId} ${req.method} ${req.url} origin=${req.headers.origin}`,
      exception?.stack || (typeof resp === 'string' ? resp : JSON.stringify(resp)),
    );
    this.logger.debug(`body=${JSON.stringify(req.body)}`);

    // Trả về cho client (kèm traceId để đối chiếu log)
    res.status(status).json({
      statusCode: status,
      message: typeof resp === 'string' ? resp : (resp as any)?.message ?? 'Error',
      errors: typeof resp === 'object' ? resp : undefined,
      traceId,
    });
  }
}
