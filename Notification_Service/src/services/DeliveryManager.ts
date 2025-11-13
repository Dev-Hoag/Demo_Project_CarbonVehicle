import logger from "../config/logger";
import emailSender from "./EmailSender";
import notificationRepository from "../repositories/NotificationRepository";
import {
  Notification,
  DeliveryResult,
  Channel,
  DeliveryStatus,
  IDeliveryManager,
  DeliveryFailedError,
  RetryConfig,
} from "../types/notification";
import { ResultSetHeader } from "mysql2";
import pool from "../config/database";

export class DeliveryManager implements IDeliveryManager {
  private retryConfig: RetryConfig;

  constructor() {
    this.retryConfig = {
      maxRetries: parseInt(process.env.MAX_RETRIES || "3"),
      backoffMultiplier: parseInt(process.env.RETRY_BACKOFF_MULTIPLIER || "2"),
      initialDelay: parseInt(process.env.INITIAL_RETRY_DELAY || "1000"),
    };
  }

  async send(notification: Notification): Promise<DeliveryResult> {
    try {
      // Create notification record
      const created = await notificationRepository.create({
        user_id: notification.userId,
        type: notification.type,
        channel: notification.channel,
        subject: notification.subject,
        content: notification.content,
        priority: notification.priority,
        metadata: notification.metadata,
      });

      logger.info("Notification record created", {
        notificationId: created.id,
        userId: notification.userId,
        type: notification.type,
        channel: notification.channel,
      });

      // Deliver based on channel
      let deliverySuccess = false;
      let error: string | undefined;

      if (notification.channel === Channel.EMAIL) {
        deliverySuccess = await this.sendEmail(notification);
        if (!deliverySuccess) {
          error = "Email delivery failed";
        }
      } else if (notification.channel === Channel.IN_APP) {
        // In-app notifications are already stored in DB
        deliverySuccess = true;
      }

      // Update status
      const status = deliverySuccess
        ? DeliveryStatus.SENT
        : DeliveryStatus.FAILED;
      await notificationRepository.updateStatus(created.id, status);

      // Log delivery attempt
      await this.logDelivery(created.id, status, error);

      return {
        success: deliverySuccess,
        notificationId: created.id,
        channel: notification.channel,
        status,
        error,
        sentAt: deliverySuccess ? new Date() : undefined,
      };
    } catch (error) {
      logger.error("Error in delivery manager", { error, notification });
      throw new DeliveryFailedError((error as Error).message);
    }
  }

  async retry(notificationId: number): Promise<DeliveryResult> {
    try {
      const notification = await notificationRepository.findById(
        notificationId
      );

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      if (notification.status === DeliveryStatus.SENT) {
        logger.warn("Notification already sent", { notificationId });
        return {
          success: true,
          notificationId,
          channel: notification.channel,
          status: DeliveryStatus.SENT,
          sentAt: notification.sent_at,
        };
      }

      // Get retry count
      const retryCount = await this.getRetryCount(notificationId);

      if (retryCount >= this.retryConfig.maxRetries) {
        logger.error("Max retries exceeded", { notificationId, retryCount });
        return {
          success: false,
          notificationId,
          channel: notification.channel,
          status: DeliveryStatus.FAILED,
          error: "Max retries exceeded",
        };
      }

      // Calculate delay
      const delay =
        this.retryConfig.initialDelay *
        Math.pow(this.retryConfig.backoffMultiplier, retryCount);
      logger.info("Retrying notification delivery", {
        notificationId,
        retryCount,
        delay,
      });

      await this.sleep(delay);

      // Retry delivery
      let deliverySuccess = false;
      let error: string | undefined;

      if (notification.channel === Channel.EMAIL) {
        deliverySuccess = await this.sendEmail({
          userId: notification.user_id,
          type: notification.type,
          channel: notification.channel,
          subject: notification.subject,
          content: notification.content,
          priority: notification.priority,
        });
        if (!deliverySuccess) {
          error = "Email delivery failed on retry";
        }
      }

      // Update status
      const status = deliverySuccess
        ? DeliveryStatus.SENT
        : DeliveryStatus.FAILED;
      await notificationRepository.updateStatus(notificationId, status);

      // Log retry attempt
      await this.logDelivery(notificationId, status, error, retryCount + 1);

      return {
        success: deliverySuccess,
        notificationId,
        channel: notification.channel,
        status,
        error,
        sentAt: deliverySuccess ? new Date() : undefined,
      };
    } catch (error) {
      logger.error("Error retrying notification", { error, notificationId });
      throw new DeliveryFailedError((error as Error).message);
    }
  }

  private async sendEmail(notification: Notification): Promise<boolean> {
    try {
      // In a real implementation, you would fetch user email from User Service
      // For now, we'll use a placeholder
      const userEmail = `user${notification.userId}@example.com`;

      const success = await emailSender.send({
        to: userEmail,
        subject: notification.subject || "Notification",
        html: notification.content,
      });

      if (success) {
        logger.info("Email sent successfully", {
          userId: notification.userId,
          type: notification.type,
        });
      } else {
        logger.error("Email sending failed", {
          userId: notification.userId,
          type: notification.type,
        });
      }

      return success;
    } catch (error) {
      logger.error("Error sending email", { error, notification });
      return false;
    }
  }

  private async logDelivery(
    notificationId: number,
    status: DeliveryStatus,
    errorMessage?: string,
    retryCount: number = 0
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO notification_logs (notification_id, status, error_message, retry_count)
        VALUES (?, ?, ?, ?)
      `;

      await connection.execute<ResultSetHeader>(query, [
        notificationId,
        status,
        errorMessage || null,
        retryCount,
      ]);

      logger.debug("Delivery logged", { notificationId, status, retryCount });
    } catch (error) {
      logger.error("Error logging delivery", { error, notificationId });
    } finally {
      connection.release();
    }
  }

  private async getRetryCount(notificationId: number): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT COALESCE(MAX(retry_count), 0) as max_retry
        FROM notification_logs
        WHERE notification_id = ?
      `;

      const [rows] = await connection.execute(query, [notificationId]);
      return (rows as any)[0].max_retry;
    } catch (error) {
      logger.error("Error getting retry count", { error, notificationId });
      return 0;
    } finally {
      connection.release();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new DeliveryManager();
