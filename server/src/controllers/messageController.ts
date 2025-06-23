//friendbook/server/src/controllers/messageController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { ConversationResult } from '../types';

const prisma = new PrismaClient();

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const senderId = req.user!.id;
  const { receiverId, content, postId } = req.body;

  if (!receiverId || typeof receiverId !== 'string') {
    return res.status(400).json({ error: 'Receiver ID is required' });
  }
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // Optionally check if users are friends before sending a message

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        postId, // Can be null for direct messages
      },
    });

    res.status(201).json(message);
    // In a real-time scenario, you would also emit this message via WebSockets
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const conversations = await prisma.message.aggregateRaw({
      pipeline: [
        {
          $match: {
            $or: [
              { senderId: userId },
              { receiverId: userId },
            ],
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$senderId', userId] },
                '$receiverId',
                '$senderId',
              ],
            },
            lastMessage: { $last: '$$ROOT' },
          },
        },
        {
          $lookup: {
            from: 'User', // Assuming your User collection name is "User"
            localField: '_id',
            foreignField: '_id',
            as: 'otherUser',
          },
        },
        {
          $unwind: '$otherUser',
        },
        {
          $project: {
            userId: '$otherUser._id',
            userName: '$otherUser.name',
            lastMessageAt: '$lastMessage.createdAt',
            lastMessageContent: '$lastMessage.content',
            _id: 0,
          },
        },
        {
          $sort: { lastMessageAt: -1 },
        },
      ],
    });

    // The result from aggregateRaw is a JSON object, so you might need to access the 'results' array
    res.json((conversations as any).results || []);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};
export const getMessagesForConversation = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { friendId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  if (!friendId || typeof friendId !== 'string') {
    return res.status(400).json({ error: 'Friend ID is required' });
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      skip: skip,
      take: limit,
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    const totalMessages = await prisma.message.count({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    });
    const totalPages = Math.ceil(totalMessages / limit);

    res.json({
      messages,
      currentPage: page,
      totalPages,
      totalMessages,
    });
  } catch (error) {
    console.error('Error fetching messages for conversation:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Optional: Implement markMessagesAsRead
// export const markMessagesAsRead = async (req: AuthRequest, res: Response) => { ... };