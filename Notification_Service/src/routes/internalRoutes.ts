import { Router, Request, Response } from "express";
import logger from "../config/logger";
import notificationService from "../services/NotificationService";
import { Channel, Priority } from "../types/notification";

const router = Router();

// Send single notification
router.post(
  "/internal/notifications/send",
  async (req: Request, res: Response) => {
    try {
      const { user_id, type, data, channel, priority } = req.body;

      if (!user_id || !type || !data) {
        res.status(400).json({
          success: false,
          message: "Missing required fields: user_id, type, data",
        });
        return;
      }

      const notificationChannel = channel || Channel.EMAIL;
      const notificationPriority = priority || Priority.MEDIUM;

      logger.info("Internal: Sending notification", {
        user_id,
        type,
        channel: notificationChannel,
      });

      // Send to both channels by default
      const emailResult = await notificationService.createNotification(
        user_id,
        type,
        data,
        Channel.EMAIL,
        notificationPriority
      );

      const inAppResult = await notificationService.createNotification(
        user_id,
        type,
        data,
        Channel.IN_APP,
        notificationPriority
      );

      res.status(200).json({
        success: true,
        data: {
          email: {
            notification_id: emailResult.notificationId,
            status: emailResult.status,
            success: emailResult.success,
          },
          in_app: {
            notification_id: inAppResult.notificationId,
            status: inAppResult.status,
            success: inAppResult.success,
          },
        },
        message: "Notifications sent",
      });
    } catch (error) {
      logger.error("Internal: Error sending notification", { error });
      res.status(500).json({
        success: false,
        message: "Failed to send notification",
        error: (error as Error).message,
      });
    }
  }
);

// Send bulk notifications
router.post(
  "/internal/notifications/send-bulk",
  async (req: Request, res: Response) => {
    try {
      const { notifications } = req.body;

      if (!notifications || !Array.isArray(notifications)) {
        res.status(400).json({
          success: false,
          message: "Missing or invalid notifications array",
        });
        return;
      }

      logger.info("Internal: Sending bulk notifications", {
        count: notifications.length,
      });

      let sent = 0;
      let failed = 0;

      for (const notification of notifications) {
        try {
          const { user_id, type, data, channel, priority } = notification;

          if (!user_id || !type || !data) {
            failed++;
            continue;
          }

          const notificationChannel = channel || Channel.EMAIL;
          const notificationPriority = priority || Priority.MEDIUM;

          await notificationService.createNotification(
            user_id,
            type,
            data,
            notificationChannel,
            notificationPriority
          );

          sent++;
        } catch (error) {
          logger.error("Internal: Error sending bulk notification", {
            error,
            notification,
          });
          failed++;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          sent,
          failed,
          total: notifications.length,
        },
        message: `Bulk notifications processed: ${sent} sent, ${failed} failed`,
      });
    } catch (error) {
      logger.error("Internal: Error sending bulk notifications", { error });
      res.status(500).json({
        success: false,
        message: "Failed to send bulk notifications",
        error: (error as Error).message,
      });
    }
  }
);

export default router;
