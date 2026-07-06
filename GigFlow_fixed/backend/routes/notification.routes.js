import express from "express";
import auth from "../middleware/auth.middleware.js";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/me", auth, getMyNotifications);
router.patch("/read-all", auth, markAllNotificationsRead);
router.patch("/:id/read", auth, markNotificationRead);

export default router;