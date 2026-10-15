import Notification from "../models/notification.js";

export const createNotification = async ({
  userId,
  title,
  description,
  type = "update",
}) => {
  if (!userId || !title?.trim() || !description?.trim()) {
    throw new Error("userId, title, and description are required");
  }

  if (!["reminder", "update"].includes(type)) {
    throw new Error("Notification type must be reminder or update");
  }

  const notification = await Notification.create({
    userId,
    title: title.trim(),
    description: description.trim(),
    type,
  });

  return notification;
};