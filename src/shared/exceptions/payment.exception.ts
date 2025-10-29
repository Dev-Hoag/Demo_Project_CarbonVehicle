import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(
      {
        statusCode,
        message,
        error: 'PaymentError',
      },
      statusCode,
    );
  }
}

export class PaymentNotFoundException extends PaymentException {
  constructor(paymentCode: string) {
    super(`Payment not found: ${paymentCode}`, HttpStatus.NOT_FOUND);
  }
}

export class DuplicatePaymentException extends PaymentException {
  constructor(idempotencyKey: string) {
    super(
      `Duplicate payment detected: ${idempotencyKey}`,
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidSignatureException extends PaymentException {
  constructor() {
    super('Invalid signature from payment gateway', HttpStatus.UNAUTHORIZED);
  }
}

export class PaymentExpiredException extends PaymentException {
  constructor(paymentCode: string) {
    super(`Payment expired: ${paymentCode}`, HttpStatus.GONE);
  }
}

export class GatewayException extends PaymentException {
  constructor(message: string) {
    super(`Gateway error: ${message}`, HttpStatus.BAD_GATEWAY);
  }
}

export class RefundException extends PaymentException {
  constructor(message: string) {
    super(`Refund error: ${message}`, HttpStatus.BAD_REQUEST);
  }
}