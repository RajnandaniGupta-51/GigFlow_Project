import Notification from "../models/Notification.js";
import { io } from "../socket/socket.js";

export const notify = async ({ userId, type, message, gigId = null, bidId = null }) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      gigId,
      bidId
    });

    io.to(userId.toString()).emit("notification", notification);

    return notification;
  } catch (err) {
    console.error("NOTIFY_ERROR:", err);
    return null;
  }
};