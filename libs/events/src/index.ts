// Base
export * from './base/base-event';

// Payment Events
export * from './payment/payment.events';

// User Events
export * from './user/user.events';

// KYC Events
export * from './kyc/kyc.events';

// Event Types Registry (for easy lookup)
export const EVENT_TYPES = {
  // Payment
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // User
  USER_CREATED: 'user.created',
  USER_VERIFIED: 'user.verified',
  USER_STATUS_CHANGED: 'user.status_changed',
  USER_PROFILE_UPDATED: 'user.profile_updated',

  // KYC
  KYC_DOCUMENT_UPLOADED: 'kyc.document_uploaded',
  KYC_DOCUMENT_VERIFIED: 'kyc.document_verified',
  KYC_STATUS_CHANGED: 'kyc.status_changed',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
