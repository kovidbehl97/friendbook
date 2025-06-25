// friendbook/server/src/controllers/notificationController.ts
import { Request, Response } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendNotificationToUser } from '../socketEvents'; // Import WebSocket utility

const prisma = new PrismaClient();

export const createNotification = async (
  recipientId: string,
  senderId: string,
  type: NotificationType,
  relatedId: string,
  message: string
): Promise<void> => {
  try {
    // Prevent sending a notification to oneself
    if (recipientId === senderId) {
      return;
    }

    // Create the notification in the database
    const newNotification = await prisma.notification.create({
      data: {
        recipientId,
        senderId,
        type,
        relatedId,
        message,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
    });

    // Send the new notification in real-time to the recipient
    sendNotificationToUser(recipientId, newNotification);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const isRead = req.query.isRead === 'true';

  try {
    const where = {
      recipientId: userId,
      ...(isRead !== undefined ? { isRead: isRead } : {}),
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
      },
    });

    const totalNotifications = await prisma.notification.count({ where });
    const totalPages = Math.ceil(totalNotifications / limit);

    res.json({
      notifications,
      currentPage: page,
      totalPages,
      totalNotifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { notificationId } = req.params;

  try {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.recipientId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to mark this notification as read' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    await prisma.notification.updateMany({
      where: { recipientId: userId },
      data: { isRead: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};