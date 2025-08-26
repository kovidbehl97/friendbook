// client/src/queries/messages/messageQueries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';

// --- Interfaces ---

// Matches the structure of a single message returned by getMessagesForConversation
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  postId: string | null; // Optional: if message is related to a post
  createdAt: string; // ISO Date string
  sender: {
    id: string;
    name: string;
  };
  receiver: {
    id: string;
    name: string;
  };
}

// Matches the structure of a single conversation returned by getConversations
export interface Conversation {
  userId: string; // ID of the other user in the conversation
  userName: string; // Name of the other user
  profileImageUrl?: string | null; // Assuming your backend might add this later for conversation list
  lastMessageAt: string; // ISO Date string
  lastMessageContent: string;
}

// Matches the full response for getMessagesForConversation
export interface MessagesResponse {
  messages: Message[];
  currentPage: number;
  totalPages: number;
  totalMessages: number;
}

// --- Query Hooks ---

// Hook to fetch the list of conversations for the current user
export const useConversations = () => {
  return useQuery<Conversation[], Error>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await axiosInstance.get('/messages/conversations');
      // Your backend returns { received: [...], sent: [...] } for friend requests,
      // but for conversations, your aggregateRaw pipeline directly projects the ConversationResult.
      // So, response.data should directly be the array of conversations.
      // However, your backend's getConversations controller returns (conversations as any).results || []
      // So we need to access the 'results' property here.
      return response.data; // Assuming response.data is already the array of conversations
    },

  });
};

// Hook to fetch messages for a specific conversation (paginated)
export const useMessagesForConversation = (friendId: string, page: number = 1, limit: number = 20) => {
  return useQuery<MessagesResponse, Error>({
    queryKey: ['messages', friendId, page, limit], // Unique key for each conversation and page
    queryFn: async () => {
      if (!friendId) {
        throw new Error('Friend ID is required to fetch messages.');
      }
      const response = await axiosInstance.get(`/messages/conversations/${friendId}`, {
        params: { page, limit },
      });
      return response.data; // This should directly be the MessagesResponse object
    },
    enabled: !!friendId, // Only run if friendId is available

    // keepPreviousData: true, // Useful for pagination to prevent flickering
  });
};

// --- Mutation Hook ---

// Hook to send a new message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation<Message, Error, { receiverId: string; content: string; postId?: string }>({
    mutationFn: async ({ receiverId, content, postId }) => {
      const response = await axiosInstance.post('/messages', { receiverId, content, postId });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate messages for this conversation to refetch the latest state
      queryClient.invalidateQueries({ queryKey: ['messages', variables.receiverId] });
      // Invalidate conversations list to update last message/time
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // OPTIMISTIC UPDATE (Advanced, but good for chat)
      // This makes the message appear instantly in the UI before API confirms
      queryClient.setQueryData<MessagesResponse | undefined>(
        ['messages', variables.receiverId, 1, 20], // Assuming we're updating the first page
        (oldData) => {
          if (!oldData) return oldData;

          // Create a mock message for optimistic update
          const mockMessage: Message = {
            id: 'temp-' + Date.now(), // Temporary ID
            senderId: 'currentUserId', // You'd need to get current user ID here
            receiverId: variables.receiverId,
            content: variables.content,
            postId: variables.postId || null,
            createdAt: new Date().toISOString(),
            sender: { id: 'currentUserId', name: 'You' }, // Mock sender
            receiver: { id: variables.receiverId, name: 'Other User' }, // Mock receiver
          };

          return {
            ...oldData,
            messages: [...oldData.messages, mockMessage], // Add new message to the end
          };
        }
      );
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    },
  });
};