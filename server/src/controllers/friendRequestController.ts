// friendbook/server/src/controllers/friendRequestController.ts
import { Request, Response } from "express";
import { PrismaClient, NotificationType } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";
// createNotification must be updated to accept the senderId
import { createNotification } from "./notificationController";

const prisma = new PrismaClient();

export const sendFriendRequest = async (req: AuthRequest, res: Response) => {
  const senderId = req.user!.id;
  const { receiverId } = req.params;

  if (senderId === receiverId) {
    return res
      .status(400)
      .json({ error: "Cannot send a friend request to yourself" });
  }

  try {
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: senderId, userBId: receiverId },
          { userAId: receiverId, userBId: senderId },
        ],
      },
    });

    if (existingFriendship) {
      console.warn(`sendFriendRequest: Users are already friends. Sender: ${senderId}, Receiver: ${receiverId}`);
      return res.status(409).json({ error: 'You are already friends with this user' });
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status !== 'pending') {
        const updatedFriendRequest = await prisma.friendRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: "pending",
            senderId: senderId,
            receiverId: receiverId,
          },
        });
        console.log(`sendFriendRequest: Reactivated old request. ID: ${updatedFriendRequest.id}, Status: ${updatedFriendRequest.status}`);

        const senderUser = await prisma.user.findUnique({
          where: { id: senderId },
          select: { name: true },
        });

        if (senderUser) {
          // CORRECTED: Passing senderId as the second argument
          await createNotification(
            receiverId,
            senderId, // <-- New argument
            NotificationType.friendRequest,
            updatedFriendRequest.id,
            `${senderUser.name} sent you a friend request.`
          );
        }
        return res.status(200).json({ message: "Friend request sent successfully (reactivated old request)", friendRequest: updatedFriendRequest });
      } else {
        console.warn(`sendFriendRequest: A pending request already exists. Sender: ${senderId}, Receiver: ${receiverId}, Existing Request Status: ${existingRequest.status}`);
        if (existingRequest.senderId === senderId) {
          return res.status(409).json({ error: 'You have already sent a friend request to this user.' });
        } else {
          return res.status(409).json({ error: 'You have a pending friend request from this user. Please accept or reject it.' });
        }
      }
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: "pending",
      },
    });

    const senderUser = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true },
    });

    if (senderUser) {
      // CORRECTED: Passing senderId as the second argument
      await createNotification(
        receiverId,
        senderId, // <-- New argument
        NotificationType.friendRequest,
        friendRequest.id,
        `${senderUser.name} sent you a friend request.`
      );
    }

    res
      .status(201)
      .json({ message: "Friend request sent successfully", friendRequest });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ error: "Failed to send friend request" });
  }
};

export const acceptFriendRequest = async (req: AuthRequest, res: Response) => {
  const receiverId = req.user!.id;
  const { requestId } = req.params;

  try {
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: { sender: true, receiver: true },
    });

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (friendRequest.receiverId !== receiverId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to accept this request" });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({ error: "Friend request is not pending" });
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: friendRequest.senderId, userBId: friendRequest.receiverId },
          { userAId: friendRequest.receiverId, userBId: friendRequest.senderId },
        ],
      },
    });

    if (existingFriendship) {
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "accepted" },
      });
      return res.status(200).json({ message: "Friend request accepted successfully (friendship already existed)" });
    }


    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "accepted" },
    });

    await prisma.friendship.create({
      data: {
        userAId: friendRequest.senderId,
        userBId: friendRequest.receiverId,
      },
    });

    const receiverUser = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { name: true },
    });
    if (receiverUser) {
      // CORRECTED: Passing senderId as the second argument
      await createNotification(
        friendRequest.senderId,
        receiverId, // <-- New argument
        NotificationType.friendRequestAccepted,
        receiverId,
        `${receiverUser.name} accepted your friend request.`
      );
    }

    res.json({ message: "Friend request accepted successfully" });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ error: "Failed to accept friend request" });
  }
};

export const rejectFriendRequest = async (req: AuthRequest, res: Response) => {
  const receiverId = req.user!.id;
  const { requestId } = req.params;

  try {
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (friendRequest.receiverId !== receiverId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to reject this request" });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({ error: "Friend request is not pending" });
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "rejected" },
    });

    const receiverUser = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { name: true },
    });
    if (receiverUser) {
      // CORRECTED: Passing senderId as the second argument
      await createNotification(
        friendRequest.senderId,
        receiverId, // <-- New argument
        NotificationType.friendRequestRejected,
        receiverId,
        `${receiverUser.name} rejected your friend request.`
      );
    }

    res.json({ message: "Friend request rejected successfully" });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    res.status(500).json({ error: "Failed to reject friend request" });
  }
};

export const getPendingFriendRequests = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user!.id;

  try {
    const receivedRequests = await prisma.friendRequest.findMany({
      where: { receiverId: userId, status: "pending" },
      include: { sender: { select: { id: true, name: true, profileImageUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    const sentRequests = await prisma.friendRequest.findMany({
      where: { senderId: userId, status: "pending" },
      include: { receiver: { select: { id: true, name: true, profileImageUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ received: receivedRequests, sent: sentRequests });
  } catch (error) {
    console.error("Error fetching pending friend requests:", error);
    res.status(500).json({ error: "Failed to fetch pending friend requests" });
  }
};