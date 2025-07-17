import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';

// --- Type Definitions ---
export type NotificationType =
  | 'friendRequest'
  | 'friendRequestAccepted'
  | 'postLiked'
  | 'postCommented'
  | 'commentLiked'
  | 'newMessage';

export interface Notification {
  id: string;
  recipientId: string;
  sender: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
  };
  type: NotificationType;
  relatedId: string;
  isRead: boolean;
  createdAt: string;
  message?: string;
}

// --- API Functions ---
const fetchNotifications = async (): Promise<{ notifications: Notification[] }> => {
  const { data } = await axiosInstance.get('/notifications');
  return data;
};

const markAllNotificationsAsReadApi = async (): Promise<void> => {
  await axiosInstance.put('/notifications/read-all');
};

const markNotificationAsReadApi = async (notificationId: string): Promise<void> => {
  await axiosInstance.patch(`/notifications/${notificationId}/read`);
};

// --- React Query Hooks ---
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    // Ensure cache updates trigger re-renders
    structuralSharing: (oldData, newData) => {
      // Deep compare to ensure new notifications trigger updates
      return JSON.stringify(oldData) !== JSON.stringify(newData) ? newData : oldData;
    },
    // Optional: Refetch every 60 seconds as a fallback
    refetchInterval: 60 * 1000,
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsAsReadApi,
    onSuccess: () => {
      queryClient.setQueryData<{ notifications: Notification[] }>(['notifications'], (oldData) => {
        if (!oldData) return oldData;
        const updatedNotifications = oldData.notifications.map((notif) => ({
          ...notif,
          isRead: true,
        }));
        return { notifications: updatedNotifications };
      });
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error);
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationAsReadApi,
    onSuccess: (data, notificationId) => {
      queryClient.setQueryData<{ notifications: Notification[] }>(['notifications'], (oldData) => {
        if (!oldData) return oldData;
        const updatedNotifications = oldData.notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        );
        return { notifications: updatedNotifications };
      });
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    },
  });
};