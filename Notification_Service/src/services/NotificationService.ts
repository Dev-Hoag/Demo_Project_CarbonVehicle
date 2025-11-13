import logger from "../config/logger";
import notificationRepository from "../repositories/NotificationRepository";
import templateEngine from "./TemplateEngine";
import deliveryManager from "./DeliveryManager";
import {
  NotificationEntity,
  QueryOptions,
  Channel,
  Priority,
  DeliveryResult,
} from "../types/notification";

export class NotificationService {
  async createNotification(
    userId: number,
    eventType: string,
    data: Record<string, any>,
    channel: Channel,
    priority: Priority = Priority.MEDIUM
  ): Promise<DeliveryResult> {
    try {
      logger.info("Creating notification", { userId, eventType, channel });

      // Render template
      const rendered = await templateEngine.renderTemplate(
        eventType,
        channel,
        data
      );

      // Send notification
      const result = await deliveryManager.send({
        userId,
        type: eventType,
        channel,
        subject: rendered.subject,
        content: rendered.content,
        priority,
        metadata: data,
      });

      logger.info("Notification created and sent", {
        userId,
        eventType,
        channel,
        notificationId: result.notificationId,
        success: result.success,
      });

      return result;
    } catch (error) {
      logger.error("Error creating notification", {
        error,
        userId,
        eventType,
        channel,
      });
      throw error;
    }
  }

  async getNotifications(
    userId: number,
    options: QueryOptions = {}
  ): Promise<{
    notifications: NotificationEntity[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const notifications = await notificationRepository.findByUserId(
        userId,
        options
      );

      // Get total count (simplified - in production, use a separate count query)
      const allNotifications = await notificationRepository.findByUserId(
        userId,
        {
          ...options,
          limit: undefined,
          offset: undefined,
        }
      );
      const total = allNotifications.length;

      logger.info("Notifications retrieved", {
        userId,
        count: notifications.length,
        total,
      });

      return {
        notifications,
        total,
        limit,
        offset,
      };
    } catch (error) {
      logger.error("Error getting notifications", { error, userId, options });
      throw error;
    }
  }

  async getUnreadNotifications(userId: number): Promise<{
    notifications: NotificationEntity[];
    count: number;
  }> {
    try {
      const notifications = await notificationRepository.findUnread(userId);
      const count = notifications.length;

      logger.info("Unread notifications retrieved", { userId, count });

      return {
        notifications,
        count,
      };
    } catch (error) {
      logger.error("Error getting unread notifications", { error, userId });
      throw error;
    }
  }

  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    try {
      // Verify notification belongs to user
      const notification = await notificationRepository.findById(
        notificationId
      );

      if (!notification) {
        logger.warn("Notification not found", { notificationId });
        return false;
      }

      if (notification.user_id !== userId) {
        logger.warn("Notification does not belong to user", {
          notificationId,
          userId,
        });
        return false;
      }

      const success = await notificationRepository.markAsRead(notificationId);

      if (success) {
        logger.info("Notification marked as read", { notificationId, userId });
      }

      return success;
    } catch (error) {
      logger.error("Error marking notification as read", {
        error,
        notificationId,
        userId,
      });
      throw error;
    }
  }

  async markAllAsRead(userId: number): Promise<number> {
    try {
      const count = await notificationRepository.markAllAsRead(userId);

      logger.info("All notifications marked as read", { userId, count });

      return count;
    } catch (error) {
      logger.error("Error marking all notifications as read", {
        error,
        userId,
      });
      throw error;
    }
  }

  async deleteNotification(
    notificationId: number,
    userId: number
  ): Promise<boolean> {
    try {
      // Verify notification belongs to user
      const notification = await notificationRepository.findById(
        notificationId
      );

      if (!notification) {
        logger.warn("Notification not found", { notificationId });
        return false;
      }

      if (notification.user_id !== userId) {
        logger.warn("Notification does not belong to user", {
          notificationId,
          userId,
        });
        return false;
      }

      const success = await notificationRepository.delete(notificationId);

      if (success) {
        logger.info("Notification deleted", { notificationId, userId });
      }

      return success;
    } catch (error) {
      logger.error("Error deleting notification", {
        error,
        notificationId,
        userId,
      });
      throw error;
    }
  }

  async getNotificationHistory(
    userId: number,
    options: QueryOptions = {}
  ): Promise<{
    notifications: NotificationEntity[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      const historyOptions: QueryOptions = {
        ...options,
        limit,
        offset,
        sortBy: "created_at",
        sortOrder: "DESC",
      };

      const notifications = await notificationRepository.findByUserId(
        userId,
        historyOptions
      );

      // Get total count
      const allNotifications = await notificationRepository.findByUserId(
        userId,
        {
          ...historyOptions,
          limit: undefined,
          offset: undefined,
        }
      );
      const total = allNotifications.length;

      logger.info("Notification history retrieved", {
        userId,
        count: notifications.length,
        total,
      });

      return {
        notifications,
        total,
        limit,
        offset,
      };
    } catch (error) {
      logger.error("Error getting notification history", {
        error,
        userId,
        options,
      });
      throw error;
    }
  }

  async getNotificationById(
    notificationId: number,
    userId: number
  ): Promise<NotificationEntity | null> {
    try {
      const notification = await notificationRepository.findById(
        notificationId
      );

      if (!notification) {
        return null;
      }

      // Verify notification belongs to user
      if (notification.user_id !== userId) {
        logger.warn("Notification does not belong to user", {
          notificationId,
          userId,
        });
        return null;
      }

      return notification;
    } catch (error) {
      logger.error("Error getting notification by id", {
        error,
        notificationId,
        userId,
      });
      throw error;
    }
  }

  async retryNotification(notificationId: number): Promise<DeliveryResult> {
    try {
      logger.info("Retrying notification", { notificationId });

      const result = await deliveryManager.retry(notificationId);

      logger.info("Notification retry completed", {
        notificationId,
        success: result.success,
      });

      return result;
    } catch (error) {
      logger.error("Error retrying notification", { error, notificationId });
      throw error;
    }
  }
}

export default new NotificationService();
