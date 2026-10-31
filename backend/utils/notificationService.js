
import Notification from "../models/Notification.js";

export async function createNotification({
  recipient,
  type,
  title,
  message,
  relatedEntityType,
  relatedEntityId,
}) {
  if (!recipient) return null;

  try {
    return await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
    });
  } catch (error) {
    // Notification failure should not silently disappear from server logs.
    // Keep the main business operation separate from this helper.
    console.error("Failed to create notification:", error.message);
    return null;
  }
}

export async function createNotifications(notifications) {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  try {
    return await Notification.insertMany(
      notifications.filter((item) => item.recipient),
      { ordered: false }
    );
  } catch (error) {
    console.error("Failed to create some notifications:", error.message);
    return [];
  }
}
