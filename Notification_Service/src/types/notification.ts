// Core type aliases
export type NotificationId = number;
export type UserId = number;
export type TemplateId = number;

// Enums
export enum Channel {
  EMAIL = "EMAIL",
  IN_APP = "IN_APP",
}

export enum DeliveryStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  READ = "READ",
}

export enum Priority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

// Core Entities
export interface NotificationEntity {
  id: NotificationId;
  user_id: UserId;
  type: string;
  channel: Channel;
  subject?: string;
  content: string;
  status: DeliveryStatus;
  priority: Priority;
  created_at: Date;
  sent_at?: Date;
  read_at?: Date;
}

export interface Template {
  id: TemplateId;
  event_type: string;
  channel: Channel;
  subject?: string;
  content: string;
  placeholders: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface NotificationLog {
  id: number;
  notification_id: NotificationId;
  status: DeliveryStatus;
  error_message?: string;
  retry_count: number;
  created_at: Date;
}

export interface NotificationMetadata {
  id: number;
  notification_id: NotificationId;
  key_name: string;
  value: string;
}

// DTOs
export interface CreateNotificationDto {
  user_id: UserId;
  type: string;
  channel: Channel;
  subject?: string;
  content: string;
  priority?: Priority;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationDto {
  status?: DeliveryStatus;
  sent_at?: Date;
  read_at?: Date;
}

// System Event
export interface SystemEvent {
  type: string;
  timestamp: Date;
  source: string;
  data: any;
  userId?: number;
  metadata?: Record<string, any>;
}

// Delivery
export interface Notification {
  userId: number;
  type: string;
  channel: Channel;
  subject?: string;
  content: string;
  priority: Priority;
  metadata?: Record<string, any>;
}

export interface DeliveryResult {
  success: boolean;
  notificationId: number;
  channel: Channel;
  status: DeliveryStatus;
  error?: string;
  sentAt?: Date;
}

// Email
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Query Options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  status?: DeliveryStatus;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

// Retry Configuration
export interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
}

// Event Handler
export type EventHandler = (event: SystemEvent) => Promise<void>;

// Repository Interfaces
export interface INotificationRepository {
  create(notification: CreateNotificationDto): Promise<NotificationEntity>;
  findById(id: number): Promise<NotificationEntity | null>;
  findByUserId(
    userId: number,
    options: QueryOptions
  ): Promise<NotificationEntity[]>;
  findUnread(userId: number): Promise<NotificationEntity[]>;
  markAsRead(id: number): Promise<boolean>;
  markAllAsRead(userId: number): Promise<number>;
  delete(id: number): Promise<boolean>;
  updateStatus(id: number, status: DeliveryStatus): Promise<boolean>;
  countUnread(userId: number): Promise<number>;
}

export interface ITemplateRepository {
  findByEventAndChannel(
    eventType: string,
    channel: Channel
  ): Promise<Template | null>;
  findAll(): Promise<Template[]>;
  findActive(): Promise<Template[]>;
}

// Service Interfaces
export interface ITemplateEngine {
  render(templateId: string, data: Record<string, any>): Promise<string>;
  getTemplate(eventType: string, channel: Channel): Promise<Template>;
}

export interface IEmailSender {
  send(email: EmailMessage): Promise<boolean>;
  verify(): Promise<boolean>;
}

export interface IDeliveryManager {
  send(notification: Notification): Promise<DeliveryResult>;
  retry(notificationId: number): Promise<DeliveryResult>;
}

export interface IEventConsumer {
  subscribe(eventType: string, handler: EventHandler): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

// Error Types
export class NotificationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "NotificationError";
  }
}

export class TemplateNotFoundError extends NotificationError {
  constructor(eventType: string, channel: Channel) {
    super(
      `Template not found for ${eventType} on ${channel}`,
      "TEMPLATE_NOT_FOUND"
    );
  }
}

export class DeliveryFailedError extends NotificationError {
  constructor(message: string, public retryable: boolean = true) {
    super(message, "DELIVERY_FAILED");
  }
}

export class UserNotFoundError extends NotificationError {
  constructor(userId: number) {
    super(`User ${userId} not found`, "USER_NOT_FOUND");
  }
}
