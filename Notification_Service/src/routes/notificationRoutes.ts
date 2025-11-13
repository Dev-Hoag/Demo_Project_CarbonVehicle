import { Router } from "express";
import notificationController from "../controllers/NotificationController";

const router = Router();

// Get notifications with pagination and filters
router.get(
  "/notifications",
  notificationController.getNotifications.bind(notificationController)
);

// Get unread notifications
router.get(
  "/notifications/unread",
  notificationController.getUnreadNotifications.bind(notificationController)
);

// Get notification history
router.get(
  "/notifications/history",
  notificationController.getNotificationHistory.bind(notificationController)
);

// Get notification by ID
router.get(
  "/notifications/:id",
  notificationController.getNotificationById.bind(notificationController)
);

// Mark notification as read
router.put(
  "/notifications/:id/read",
  notificationController.markAsRead.bind(notificationController)
);

// Delete notification
router.delete(
  "/notifications/:id",
  notificationController.deleteNotification.bind(notificationController)
);

// Mark all notifications as read
router.post(
  "/notifications/read-all",
  notificationController.markAllAsRead.bind(notificationController)
);

export default router;
