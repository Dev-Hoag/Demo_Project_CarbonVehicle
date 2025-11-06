import { BaseEvent } from '../base/base-event';

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED',
  DELETED = 'DELETED',
}

export enum UserType {
  EV_OWNER = 'EV_OWNER',
  BUYER = 'BUYER',
  CVA = 'CVA',
}

// ==================== User Created Event ====================
export interface IUserCreatedPayload {
  userId: number;
  email: string;
  userType: UserType;
  fullName?: string;
  createdAt: string;
}

export class UserCreatedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'user.created';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IUserCreatedPayload,
    metadata: { correlationId: string; actor?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: UserCreatedEvent.EVENT_TYPE,
      version: UserCreatedEvent.VERSION,
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

// ==================== User Verified Event ====================
export interface IUserVerifiedPayload {
  userId: number;
  email: string;
  verifiedAt: string;
}

export class UserVerifiedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'user.verified';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IUserVerifiedPayload,
    metadata: { correlationId: string; causationId?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: UserVerifiedEvent.EVENT_TYPE,
      version: UserVerifiedEvent.VERSION,
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

// ==================== User Status Changed Event ====================
export interface IUserStatusChangedPayload {
  userId: number;
  email: string;
  oldStatus: UserStatus;
  newStatus: UserStatus;
  reason?: string;
  changedBy?: string;
  changedAt: string;
}

export class UserStatusChangedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'user.status_changed';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IUserStatusChangedPayload,
    metadata: { correlationId: string; actor?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: UserStatusChangedEvent.EVENT_TYPE,
      version: UserStatusChangedEvent.VERSION,
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

// ==================== User Profile Updated Event ====================
export interface IUserProfileUpdatedPayload {
  userId: number;
  updatedFields: string[];
  updatedAt: string;
}

export class UserProfileUpdatedEvent extends BaseEvent {
  static readonly EVENT_TYPE = 'user.profile_updated';
  static readonly VERSION = 1;

  constructor(
    aggregateId: string,
    payload: IUserProfileUpdatedPayload,
    metadata: { correlationId: string; actor?: string },
  ) {
    super({
      id: BaseEvent.generateId(),
      type: UserProfileUpdatedEvent.EVENT_TYPE,
      version: UserProfileUpdatedEvent.VERSION,
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
