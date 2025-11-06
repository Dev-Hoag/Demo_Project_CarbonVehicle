import { BaseEvent } from '../base/base-event';

export enum KYCDocumentType {
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
}

export enum KYCStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ==================== KYC Document Uploaded Event ====================
export interface IKYCDocumentUploadedPayload {
  documentId: number;
  userId: number;
  documentType: KYCDocumentType;
  documentNumber: string;
  fileUrl: string;
  uploadedAt: string;
}

export class KYCDocumentUploadedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'kyc.document_uploaded';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IKYCDocumentUploadedPayload,
    metadata: { correlationId: string; actor?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: KYCDocumentUploadedEvent.EVENT_TYPE,
      version: KYCDocumentUploadedEvent.VERSION,
      source: 'user-service',
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

// ==================== KYC Document Verified Event ====================
export interface IKYCDocumentVerifiedPayload {
  documentId: number;
  userId: number;
  documentType: KYCDocumentType;
  status: KYCStatus;
  verifiedBy: string;
  notes?: string;
  verifiedAt: string;
}

export class KYCDocumentVerifiedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'kyc.document_verified';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IKYCDocumentVerifiedPayload,
    metadata: { correlationId: string; causationId?: string; actor?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: KYCDocumentVerifiedEvent.EVENT_TYPE,
      version: KYCDocumentVerifiedEvent.VERSION,
      source: 'user-service',
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

// ==================== KYC Status Changed Event ====================
export interface IKYCStatusChangedPayload {
  userId: number;
  oldStatus: KYCStatus;
  newStatus: KYCStatus;
  reason?: string;
  changedBy?: string;
  changedAt: string;
}

export class KYCStatusChangedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'kyc.status_changed';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IKYCStatusChangedPayload,
    metadata: { correlationId: string; actor?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: KYCStatusChangedEvent.EVENT_TYPE,
      version: KYCStatusChangedEvent.VERSION,
      source: 'user-service',
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
