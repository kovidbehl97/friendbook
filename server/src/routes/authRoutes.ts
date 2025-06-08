//server/src/routes/authRoutes.ts
import { Router, Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  verifyRefreshToken,
  signAccessToken,
  deleteRefreshToken,
  verifyAccessToken,
  getUserById
} from '../auth';
import jwt from 'jsonwebtoken';


import cookieParser from 'cookie-parser';
import express from 'express';

const router = Router();

// Middleware to use cookieParser
router.use(cookieParser());
router.use(express.json());

router.post('/register', async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body);
    return res.status(201).json({ message: 'User created', user });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message || 'Failed to register' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken, user } = await loginUser(req.body);

    // Set HttpOnly cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({ accessToken, user });
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message || 'Failed to login' });
  }
});

router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'Refresh token missing' });

    const userId = await verifyRefreshToken(token);
    const accessToken = signAccessToken(userId);

    // Get user details from DB
    const user = await getUserById(userId); // You must implement this function if it doesn't exist

    return res.json({ accessToken, user });
  } catch (error) {
    return res.status(401).json({ error: (error as Error).message || 'Invalid refresh token' });
  }
});



router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) await deleteRefreshToken(token);

    res.clearCookie('refreshToken');
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyAccessToken(token);

    if (!user) return res.status(401).json({ error: 'Invalid token' });

    return res.json(user);
  } catch (error) {
    console.error('Error in /auth/me:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});
export default router;
