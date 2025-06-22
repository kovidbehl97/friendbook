// friendbook/server/src/routes/friendRoutes.ts
import { Router } from 'express';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingFriendRequests,
} from '../controllers/friendRequestController';
import {
  getFriends,
  unfriendUser,
} from '../controllers/friendshipController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// --- Friend Request Routes ---
router.post('/request/:receiverId', authMiddleware, sendFriendRequest);
router.post('/request/accept/:requestId', authMiddleware, acceptFriendRequest);
router.post('/request/reject/:requestId', authMiddleware, rejectFriendRequest);
router.get('/requests', authMiddleware, getPendingFriendRequests);

// --- Friendship Routes ---
router.get('/', authMiddleware, getFriends);
router.delete('/:friendId', authMiddleware, unfriendUser);

export default router;