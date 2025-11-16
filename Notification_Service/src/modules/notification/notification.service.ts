import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { DeviceToken } from './entities/device-token.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationGateway } from './notification.gateway';
import { SendNotificationDto, SendInternalNotificationDto } from './dto/send-notification.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepo: Repository<NotificationPreference>,
    @InjectRepository(DeviceToken)
    private deviceTokenRepo: Repository<DeviceToken>,
    @InjectRepository(NotificationLog)
    private logRepo: Repository<NotificationLog>,
    @InjectRepository(NotificationTemplate)
    private templateRepo: Repository<NotificationTemplate>,
    private firebaseService: FirebaseService,
    @Inject(forwardRef(() => NotificationGateway))
    private notificationGateway: NotificationGateway,
  ) {}

  async sendNotification(dto: SendNotificationDto): Promise<Notification> {
    const { userId, type, channel, title, message, data } = dto;

    // Check user preferences
    const canSend = await this.checkUserPreferences(userId, channel as NotificationChannel);
    if (!canSend) {
      this.logger.log(`User ${userId} has disabled ${channel} notifications`);
      return null;
    }

    // Create notification record
    const notification = this.notificationRepo.create({
      userId,
      type: type as NotificationType,
      channel: channel as NotificationChannel,
      title,
      message,
      data,
      status: NotificationStatus.PENDING,
    });

    await this.notificationRepo.save(notification);

    // Send based on channel
    try {
      await this.logStatus(notification.id, 'SENDING');

      if (channel === NotificationChannel.PUSH) {
        await this.sendPushNotification(userId, title, message, data);
      } else if (channel === NotificationChannel.EMAIL) {
        // TODO: Implement email sending
        this.logger.log('Email sending not yet implemented');
      } else if (channel === NotificationChannel.SMS) {
        // TODO: Implement SMS sending
        this.logger.log('SMS sending not yet implemented');
      }

      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await this.notificationRepo.save(notification);
      await this.logStatus(notification.id, 'SENT');

      // 🔥 Send real-time notification via WebSocket
      this.notificationGateway.sendNotificationToUser(userId, notification);
      
      // Update unread count
      const unreadCount = await this.getUnreadCount(userId);
      this.notificationGateway.sendUnreadCountUpdate(userId, unreadCount);

      return notification;
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      await this.notificationRepo.save(notification);
      await this.logStatus(notification.id, 'FAILED', error.message);
      throw error;
    }
  }

  async sendInternalNotification(dto: SendInternalNotificationDto): Promise<Notification[]> {
    const { userId, templateCode, variables, channels } = dto;

    // Get template
    const template = await this.templateRepo.findOne({ where: { code: templateCode, isActive: true } });
    if (!template) {
      throw new NotFoundException(`Template ${templateCode} not found`);
    }

    // Process template with variables
    const title = this.processTemplate(template.title, variables);
    const message = this.processTemplate(template.body, variables);

    // Send to specified channels or default to template channel
    const targetChannels = channels || [template.channel as NotificationChannel];
    const notifications: Notification[] = [];

    for (const channel of targetChannels) {
      try {
        const notification = await this.sendNotification({
          userId,
          type: this.inferTypeFromTemplate(templateCode),
          channel,
          title,
          message,
          data: variables,
        });
        if (notification) {
          notifications.push(notification);
        }
      } catch (error) {
        this.logger.error(`Failed to send notification via ${channel}:`, error.message);
      }
    }

    return notifications;
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
    const tokens = await this.deviceTokenRepo.find({
      where: { userId, isActive: true },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No active device tokens found for user ${userId}`);
      return;
    }

    const deviceTokens = tokens.map(t => t.token);

    try {
      await this.firebaseService.sendMulticast(deviceTokens, title, body, data);
      
      // Update last used timestamp
      await this.deviceTokenRepo.update(
        { userId, isActive: true },
        { lastUsedAt: new Date() },
      );
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${userId}:`, error.message);
      throw error;
    }
  }

  async getNotifications(userId: string, page = 1, limit = 20): Promise<{ data: Notification[]; total: number }> {
    const [data, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, status: NotificationStatus.SENT },
    });
  }

  async markAsRead(userId: string, notificationId: number): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, status: NotificationStatus.SENT },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
  }

  async deleteNotification(userId: string, notificationId: number): Promise<void> {
    const result = await this.notificationRepo.delete({ id: notificationId, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async getPreferences(userId: string): Promise<NotificationPreference> {
    let preferences = await this.preferenceRepo.findOne({ where: { userId } });
    
    if (!preferences) {
      preferences = this.preferenceRepo.create({
        userId,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        inAppEnabled: true,
      });
      await this.preferenceRepo.save(preferences);
    }

    return preferences;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<NotificationPreference> {
    let preferences = await this.getPreferences(userId);
    
    Object.assign(preferences, dto);
    return this.preferenceRepo.save(preferences);
  }

  async registerDevice(dto: RegisterDeviceDto): Promise<DeviceToken> {
    const { userId, token, deviceType, deviceName } = dto;

    // Check if token already exists
    let deviceToken = await this.deviceTokenRepo.findOne({ where: { token } });

    if (deviceToken) {
      deviceToken.userId = userId;
      deviceToken.deviceType = deviceType;
      deviceToken.deviceName = deviceName;
      deviceToken.isActive = true;
      deviceToken.lastUsedAt = new Date();
    } else {
      deviceToken = this.deviceTokenRepo.create({
        userId,
        token,
        deviceType,
        deviceName,
        isActive: true,
      });
    }

    return this.deviceTokenRepo.save(deviceToken);
  }

  async getNotificationHistory(userId: string, days = 30): Promise<Notification[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  private async checkUserPreferences(userId: string, channel: NotificationChannel): Promise<boolean> {
    const preferences = await this.getPreferences(userId);

    switch (channel) {
      case NotificationChannel.EMAIL:
        return preferences.emailEnabled;
      case NotificationChannel.SMS:
        return preferences.smsEnabled;
      case NotificationChannel.PUSH:
        return preferences.pushEnabled;
      case NotificationChannel.IN_APP:
        return preferences.inAppEnabled;
      default:
        return true;
    }
  }

  private async logStatus(notificationId: number, status: string, errorMessage?: string): Promise<void> {
    const log = this.logRepo.create({
      notificationId,
      status,
      errorMessage,
    });
    await this.logRepo.save(log);
  }

  private processTemplate(template: string, variables?: Record<string, string>): string {
    if (!variables) return template;

    let processed = template;
    for (const [key, value] of Object.entries(variables)) {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return processed;
  }

  private inferTypeFromTemplate(templateCode: string): NotificationType {
    const typeMap: Record<string, NotificationType> = {
      TRIP_VERIFIED: NotificationType.TRIP_VERIFIED,
      LISTING_CREATED: NotificationType.LISTING_CREATED,
      LISTING_SOLD: NotificationType.LISTING_SOLD,
      PAYMENT_COMPLETED: NotificationType.PAYMENT_COMPLETED,
      CREDIT_ISSUED: NotificationType.CREDIT_ISSUED,
      WITHDRAWAL_APPROVED: NotificationType.WITHDRAWAL_APPROVED,
      SYSTEM_ALERT: NotificationType.SYSTEM_ALERT,
    };

    return typeMap[templateCode] || NotificationType.SYSTEM_ALERT;
  }
}
