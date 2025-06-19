// friendbook/server/src/routes/commentRoutes.ts
import { Router } from 'express';
import { createComment, likeComment, getCommentsForPost } from '../controllers/commentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authMiddleware, createComment);
router.get('/', getCommentsForPost);
router.post('/:commentId/like', authMiddleware, likeComment);

export default router;