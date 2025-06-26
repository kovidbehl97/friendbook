//friendbook/server/src/routes/notificationRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  // deleteNotification,
} from '../controllers/notificationController';

const router = Router();

router.get('/', authMiddleware, getNotifications);
router.patch('/:notificationId/read', authMiddleware, markNotificationAsRead);
router.put('/read-all', authMiddleware, markAllNotificationsAsRead);
// router.delete('/:notificationId', authMiddleware, deleteNotification); // Optional

export default router;