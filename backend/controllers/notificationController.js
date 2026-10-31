
import mongoose from "mongoose";
import Notification from "../models/Notification.js";

export async function listMyNotifications(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const filter = { recipient: req.user.id };

    if (req.query.unread === "true") {
      filter.readAt = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        recipient: req.user.id,
        readAt: null,
      }),
    ]);

    return res.json({
      notifications: notifications.map((notification) => ({
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId?.toString(),
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.notificationId)) {
      return res.status(400).json({ message: "Invalid notification ID." });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        recipient: req.user.id,
      },
      { $set: { readAt: new Date() } },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    return res.json({
      message: "Notification marked as read.",
      notification: {
        id: notification._id.toString(),
        readAt: notification.readAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req, res, next) {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user.id,
        readAt: null,
      },
      { $set: { readAt: new Date() } }
    );

    return res.json({
      message: "Notifications marked as read.",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
}
