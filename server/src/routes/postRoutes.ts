import { Router } from 'express';
import { 
  getPosts, 
  getPostById, 
  getUserPosts, 
  createPost, 
  likePost,
  deletePost 
} from '../controllers/postController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getPosts);
// Route to get a single post by its ID
router.get('/:postId', authMiddleware, getPostById);
// NEW ROUTE: Get all posts for a specific user
router.get('/user/:userId', authMiddleware, getUserPosts);
router.post('/', authMiddleware, createPost);
router.post('/:postId/like', authMiddleware, likePost);
// Add the delete route if you have it
router.delete('/:postId', authMiddleware, deletePost);


export default router;