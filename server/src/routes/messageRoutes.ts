//friendbook/server/src/routes/messageRoutes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  sendMessage,
  getConversations,
  getMessagesForConversation,
  // markMessagesAsRead,
} from '../controllers/messageController';

const router = Router();

router.post('/', authMiddleware, sendMessage);
router.get('/conversations', authMiddleware, getConversations);
router.get('/conversations/:friendId', authMiddleware, getMessagesForConversation);
// router.patch('/read/:conversationId', authMiddleware, markMessagesAsRead); // Optional

export default router;