//friendbook/server/src/controllers/friendshipController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const getFriends = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
      include: {
        userA: { select: { id: true, name: true, profileImageUrl: true } }, // Add profileImageUrl
        userB: { select: { id: true, name: true, profileImageUrl: true } }, // Add profileImageUrl
      },
      orderBy: { createdAt: 'desc' },
    });

    const friends = friendships.map((friendship) => {
      if (friendship.userAId === userId) {
        return friendship.userB;
      } else {
        return friendship.userA;
      }
    });

    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
};

export const unfriendUser = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { friendId } = req.params;

  try {
    const friendship = await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
      },
    });

    if (friendship.count > 0) {
      res.json({ message: 'User unfriended successfully' });
    } else {
      res.status(404).json({ error: 'Friendship not found' });
    }
  } catch (error) {
    console.error('Error unfriending user:', error);
    res.status(500).json({ error: 'Failed to unfriend user' });
  }
};