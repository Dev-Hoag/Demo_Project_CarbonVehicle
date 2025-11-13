import { Request, Response } from "express";
import logger from "../config/logger";
import notificationService from "../services/NotificationService";
import { DeliveryStatus } from "../types/notification";

export class NotificationController {
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      // In production, get userId from authenticated session/JWT
      const userId = parseInt(req.query.user_id as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as DeliveryStatus | undefined;

      const result = await notificationService.getNotifications(userId, {
        limit,
        offset,
        status,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error in getNotifications controller", { error });
      res.status(500).json({
        success: false,
        message: "Failed to retrieve notifications",
        error: (error as Error).message,
      });
    }
  }

  async getUnreadNotifications(req: Request, res: Response): Promise<void> {
    try {
      // In production, get userId from authenticated session/JWT
      const userId = parseInt(req.query.user_id as string) || 1;

      const result = await notificationService.getUnreadNotifications(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error in getUnreadNotifications controller", { error });
      res.status(500).json({
        success: false,
        message: "Failed to retrieve unread notifications",
        error: (error as Error).message,
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = parseInt(req.params.id);
      // In production, get userId from authenticated session/JWT
      const userId = parseInt(req.body.user_id as string) || 1;

      if (isNaN(notificationId)) {
        res.status(400).json({
          success: false,
          message: "Invalid notification ID",
        });
        return;
      }

      const success = await notificationService.markAsRead(
        notificationId,
        userId
      );

      if (!success) {
        res.status(404).json({
          success: false,
          message: "Notification not found or already read",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      logger.error("Error in markAsRead controller", { error });
      res.status(500).json({
        success: false,
        message: "Failed to mark notification as read",
        error: (error as Error).message,
      });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = parseInt(req.params.id);
      // In production, get userId from authenticated session/JWT
      const userId = parseInt(req.body.user_id as string) || 1;

      if (isNaN(notificationId)) {
        res.status(400).json({
          success: false,
          message: "Invalid notification ID",
        });
        return;
      }

      const success = await notificationService.deleteNotification(
        notificationId,
        userId
      );

      if (!success) {
        res.status(404).json({
          success: false,
          message: "Notification not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Notification deleted",
      });
    } catch (error) {
      logger.error("Error in deleteNotification controller", { error });
      res.status(500).json({
        success: false,
        message: "Failed to delete notification",
        error: (error as Error).message,
      });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      // In production, get userId from authenticated session/JWT
      const userId = parseInt(req.body.user_id as string) || 1;

      const count = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        data: {
          updated_count: count,
        },
        message: `${count} notifications marked as read`,
      });
    } catch (error) {
      logger.error("Error in markAllAsRead controller", { error });
      res.status(500).json({
        success: false,
        message: "Failed to mark all notifications as read",
        error: (error as Error).message,
      });
    }
  }

  async getNotificationHistory(req: Request, res: Response): Promise<void> {
    try {
      // In production, get userId from authenticated session/JWT
      const userId = parseInt(req.query.user_id as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await notificationService.getNotificationHistory(userId, {
        limit,
        offset,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error in getNotificationHistory controller", { error });
      res.status(500).json({
        success: false,
        message: "Failed to retrieve notification history",
        error: (error as Error).message,
      });
    }
  }

  async getNotificationById(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = parseInt(req.params.id);
      // In production, get userId from authenticated session/JWT
      const userId = parseInt(req.query.user_id as string) || 1;

      if (isNaN(notificationId)) {
        res.status(400).json({
          success: false,
          message: "Invalid notification ID",
        });
        return;
      }

      const notification = await notificationService.getNotificationById(
        notificationId,
        userId
      );

      if (!notification) {
        res.status(404).json({
          success: false,
          message: "Notification not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      logger.error("Error in getNotificationById controller", { error });
      res.status(500).json({
        success: false,
        message: "Failed to retrieve notification",
        error: (error as Error).message,
      });
    }
  }
}

export default new NotificationController();
