// friendbook/server/src/routes/userRoutes.ts
import { Router } from 'express';
import {
  getUserProfile,
  searchUsers,
  updateUserProfile,
  addWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  addEducationExperience,
  updateEducationExperience,
  deleteEducationExperience,
} from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Route for fetching any user's profile (can be public or requires auth)
// Depending on your app, you might want this public or behind auth


// Route for authenticated user to update their OWN profile
router.put('/profile', authMiddleware, updateUserProfile); // Use PUT for full replacement, PATCH if partial updates are desired
router.get('/search', authMiddleware, searchUsers);
router.get('/:userId', authMiddleware, getUserProfile); // Using authMiddleware here to allow req.user if present
// Routes for Work Experiences
router.post('/:userId/work', authMiddleware, addWorkExperience); // Assuming current user manages their own work
router.put('/:userId/work/:workId', authMiddleware, updateWorkExperience);
router.delete('/:userId/work/:workId', authMiddleware, deleteWorkExperience);

// Routes for Education Experiences
router.post('/:userId/education', authMiddleware, addEducationExperience); // Assuming current user manages their own education
router.put('/:userId/education/:educationId', authMiddleware, updateEducationExperience);
router.delete('/:userId/education/:educationId', authMiddleware, deleteEducationExperience);


export default router;