import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  listMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

const router = Router();

router.use(authenticate);

router.get("/", listMyNotifications);
router.patch("/read-all", markAllNotificationsAsRead);
router.patch("/:notificationId/read", markNotificationAsRead);

export default router;
