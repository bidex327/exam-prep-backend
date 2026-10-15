import express from "express";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createTestNotification,
} from "../controllers/notificationController.js";

import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a test notification
router.post("/test", protect, createTestNotification);

// Get all notifications for the logged-in user
router.get("/", protect, getNotifications);

// Mark all notifications as read
router.patch("/read-all", protect, markAllNotificationsAsRead);

// Mark one notification as read
router.patch("/:id/read", protect, markNotificationAsRead);

export default router;