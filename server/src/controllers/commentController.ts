import { Request, Response } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { createNotification } from './notificationController';

const prisma = new PrismaClient();

// Helper to format a comment for consistent frontend response
const formatCommentForFrontend = async (
  comment: {
    id: string;
    postId: string;
    userId: string;
    content: string;
    likes: string[];
    createdAt: Date;
  }
) => {
  const user = await prisma.user.findUnique({
    where: { id: comment.userId },
    select: { id: true, name: true, profileImageUrl: true }
  });

  const likedUsers = await prisma.user.findMany({
    where: { id: { in: comment.likes } },
    select: { id: true, name: true, profileImageUrl: true }
  });

  return {
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    content: comment.content,
    user: user || { id: comment.userId, name: 'Unknown User', profileImageUrl: null },
    likes: likedUsers,
    totalLikes: likedUsers.length,
    createdAt: comment.createdAt.toISOString(),
  };
};

export const getCommentsForPost = async (req: Request, res: Response) => {
  const postId = req.query.postId as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  if (!postId || typeof postId !== 'string') {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { postId: postId },
      include: {
        user: { select: { id: true, name: true, profileImageUrl: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limit,
    });

    const totalComments = await prisma.comment.count({ where: { postId: postId } });
    const totalPages = Math.ceil(totalComments / limit);

    const formattedCommentsPromises = comments.map(async (comment) => {
      const likedUsers = await prisma.user.findMany({
        where: { id: { in: comment.likes } },
        select: { id: true, name: true, profileImageUrl: true }
      });

      return {
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
        user: comment.user,
        likes: likedUsers,
        totalLikes: likedUsers.length,
        createdAt: comment.createdAt.toISOString(),
      };
    });

    const formattedComments = await Promise.all(formattedCommentsPromises);

    res.json({
      comments: formattedComments,
      currentPage: page,
      totalPages,
      totalComments,
    });
  } catch (error) {
    console.error('Error fetching comments for post:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  const { postId, content } = req.body;
  const userId = req.user!.id;

  if (!postId || typeof postId !== 'string') {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const createdComment = await prisma.comment.create({
      data: {
        postId,
        userId,
        content,
      },
    });

    // Create notification for the post author
    if (post.userId !== userId) {
      const senderUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      if (senderUser) {
        await createNotification(
          post.userId, // recipientId
          userId,     // senderId
          NotificationType.postCommented,
          postId,     // relatedId: use postId instead of commentId
          `${senderUser.name} commented on your post.`
        );
      }
    }

    const formattedComment = await formatCommentForFrontend(createdComment);

    if (!formattedComment) {
      return res.status(500).json({ error: 'Failed to format new comment response.' });
    }

    res.status(201).json(formattedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

export const likeComment = async (req: AuthRequest, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, likes: true, postId: true } // Include postId
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const isLiked = comment.likes.includes(userId);
    const updatedLikes = isLiked
      ? comment.likes.filter(id => id !== userId)
      : [...comment.likes, userId];

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { likes: updatedLikes },
    });

    // Create notification for the comment author
    if (!isLiked && comment.userId !== userId) {
      const senderUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      if (senderUser) {
        await createNotification(
          comment.userId, // recipientId
          userId,        // senderId
          NotificationType.commentLiked,
          comment.postId, // relatedId: use postId instead of commentId
          `${senderUser.name} liked your comment.`
        );
      }
    }

    const formattedComment = await formatCommentForFrontend(updatedComment);

    if (!formattedComment) {
      return res.status(500).json({ error: 'Failed to format updated comment response.' });
    }

    res.json(formattedComment);
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
};