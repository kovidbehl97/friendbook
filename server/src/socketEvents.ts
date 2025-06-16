import { WebSocketServer } from 'ws';
import { Notification, NotificationType } from '@prisma/client';

// Type for WebSocket with userId
interface ExtendedWebSocket {
  userId?: string;
  send: (data: string) => void;
  readyState: number;
}

// Client-side Notification type to match frontend expectations
interface ClientNotification {
  id: string;
  recipientId: string;
  sender: {
    id: string;
    name: string;
    profileImageUrl?: string; // Matches client-side Notification interface
  };
  type: NotificationType;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
  message?: string;
}

// Reference to the WebSocket server
let wss: WebSocketServer | null = null;

// Initialize the WebSocket server reference
export const initializeWebSocket = (server: WebSocketServer) => {
  wss = server;
};

// Send a notification to a specific user
export const sendNotificationToUser = (
  recipientId: string,
  notification: Notification & { sender: { id: string; name: string; profileImageUrl: string | null } }
) => {
  if (!wss) {
    console.error('WebSocket server not initialized');
    return;
  }

  // Transform Prisma notification to client-compatible format
  const clientNotification: ClientNotification = {
    id: notification.id,
    recipientId: notification.recipientId,
    sender: {
      id: notification.sender.id,
      name: notification.sender.name,
      // Convert null to undefined to match client type
      profileImageUrl: notification.sender.profileImageUrl ?? undefined,
    },
    type: notification.type,
    relatedId: notification.relatedId,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    message: notification.message || undefined,
  };

  console.log('Sending notification to user:', recipientId, clientNotification);

  wss.clients.forEach((client: any) => {
    const extendedClient = client as ExtendedWebSocket;
    if (
      extendedClient.userId === recipientId &&
      extendedClient.readyState === WebSocket.OPEN
    ) {
      extendedClient.send(
        JSON.stringify({
          type: 'new_notification',
          payload: clientNotification,
        })
      );
    }
  });
};