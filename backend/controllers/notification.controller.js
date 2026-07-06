import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("GET_NOTIFICATIONS_ERROR:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    console.error("MARK_NOTIFICATION_ERROR:", err);
    res.status(500).json({ message: "Failed to update notification" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("MARK_ALL_NOTIFICATIONS_ERROR:", err);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};