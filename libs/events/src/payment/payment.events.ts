import { BaseEvent, IBaseEvent } from '../base/base-event';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

// Payment status enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentGateway {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

// ==================== Payment Initiated Event ====================
export interface IPaymentInitiatedPayload {
  paymentCode: string;
  transactionId: string;
  userId: number;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  orderInfo: string;
  bankCode?: string;
  ipAddress?: string;
}

export class PaymentInitiatedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'payment.initiated';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IPaymentInitiatedPayload,
    metadata: { correlationId: string; actor?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: PaymentInitiatedEvent.EVENT_TYPE,
      version: PaymentInitiatedEvent.VERSION,
      source: 'payment-service',
      aggregateId,
      timestamp: new Date().toISOString(),
      payload,
      metadata: {
        ...metadata,
        retries: 0,
      },
    });
  }
}

// ==================== Payment Completed Event ====================
export interface IPaymentCompletedPayload {
  paymentCode: string;
  transactionId: string;
  userId: number;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  orderInfo: string;
  gatewayTransactionId?: string;
  gatewayResponseCode?: string;
  completedAt: string;
}

export class PaymentCompletedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'payment.completed';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IPaymentCompletedPayload,
    metadata: { correlationId: string; causationId?: string; actor?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: PaymentCompletedEvent.EVENT_TYPE,
      version: PaymentCompletedEvent.VERSION,
      source: 'payment-service',
      aggregateId,
      timestamp: new Date().toISOString(),
      payload,
      metadata: {
        ...metadata,
        retries: 0,
      },
    });
  }
}

// ==================== Payment Failed Event ====================
export interface IPaymentFailedPayload {
  paymentCode: string;
  transactionId: string;
  userId: number;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  reason: string;
  gatewayResponseCode?: string;
  gatewayResponseMsg?: string;
  failedAt: string;
}

export class PaymentFailedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'payment.failed';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IPaymentFailedPayload,
    metadata: { correlationId: string; causationId?: string; actor?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: PaymentFailedEvent.EVENT_TYPE,
      version: PaymentFailedEvent.VERSION,
      source: 'payment-service',
      aggregateId,
      timestamp: new Date().toISOString(),
      payload,
      metadata: {
        ...metadata,
        retries: 0,
      },
    });
  }
}

// ==================== Payment Refunded Event ====================
export interface IPaymentRefundedPayload {
  paymentCode: string;
  refundCode: string;
  userId: number;
  amount: number;
  currency: string;
  reason: string;
  refundedBy?: string;
  refundedAt: string;
}

export class PaymentRefundedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'payment.refunded';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IPaymentRefundedPayload,
    metadata: { correlationId: string; causationId?: string; actor?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: PaymentRefundedEvent.EVENT_TYPE,
      version: PaymentRefundedEvent.VERSION,
      source: 'payment-service',
      aggregateId,
      timestamp: new Date().toISOString(),
      payload,
      metadata: {
        ...metadata,
        retries: 0,
      },
    });
  }
}
