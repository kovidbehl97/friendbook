// client/src/queries/friends/friendQueries.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
// Assuming UserProfile is defined here

// Define FriendshipStatus type if not already defined globally
// This should ideally be in a shared types file (e.g., src/types/common.ts or src/types/friendship.ts)
export type FriendshipStatus = 'FRIEND' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NONE';

// ------------------------------------
// Interfaces for Friends & Requests
// ------------------------------------

// Friend model (what backend returns for a direct friend)
export interface Friend {
  id: string;
  name: string;
  profileImageUrl?: string | null;
  // Add other fields you expect from a friend object (e.g., email, bio)
}

// Friend Request model (what backend returns for a request)
export interface FriendRequest {
  id: string; // ID of the friend request itself
  sender: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
    // ... any other sender info you need to display
  };
  receiver: {
    id: string;
    name: string;
    profileImageUrl?: string | null;
    // ... any other receiver info
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

// **NEW INTERFACE**: Represents the full response structure from '/friends/requests'
export interface FriendRequestsApiResponse {
  received: FriendRequest[];
  sent: FriendRequest[];
}

// ------------------------------------
// Query Hooks
// ------------------------------------

// Hook to fetch the current user's friends list
export const useFriends = () => {
  return useQuery<Friend[], Error>({
    queryKey: ['friends'],
    queryFn: async () => {
      const response = await axiosInstance.get('/friends');
      return response.data;
    },
   
  });
};

// Hook to fetch friend requests received by the current user
export const useFriendRequestsReceived = () => {
  // We expect an array of FriendRequest, but the API sends FriendRequestsApiResponse
  return useQuery<FriendRequest[], Error>({
    queryKey: ['friendRequestsReceived'],
    queryFn: async () => {
      // Specify the expected API response type for axios
      const response = await axiosInstance.get<FriendRequestsApiResponse>('/friends/requests');
      // **CRUCIAL CHANGE:** Extract the 'received' array from the response data
      // We also add a safeguard in case 'received' is not an array or missing
      return Array.isArray(response.data.received) ? response.data.received : [];
    },
    staleTime: 0,
    refetchInterval: 1000,
  });
};


// Hook to fetch friend requests sent by the current user (optional)
// Note: You don't have a specific backend endpoint for '/friends/requests/sent'.
// If you implement this, you'll need to add a corresponding route in friendRoutes.ts
export const useFriendRequestsSent = () => {
  return useQuery<FriendRequest[], Error>({
    queryKey: ['friendRequestsSent'],
    queryFn: async () => {
      // This endpoint is NOT in your provided backend routes.
      // If you need it, you'll have to add router.get('/requests/sent', ...) to friendRoutes.ts
      const response = await axiosInstance.get('/friends/requests/sent');
      return response.data;
    },
    staleTime:0,
    refetchInterval: 1000,
  });
};

// ------------------------------------
// Mutation Hooks
// ------------------------------------

// Mutation to send a friend request
export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { receiverId: string }>({
    mutationFn: async ({ receiverId }) => {
      await axiosInstance.post(`/friends/request/${receiverId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['friendRequestsSent'] });
    },
    onError: (error) => {
      console.error('Error sending friend request:', error);
      // Handle error (e.g., show a toast notification)
    },
  });
};

// Mutation to accept a friend request
export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { requestId: string }>({
    mutationFn: async ({ requestId }) => {
      await axiosInstance.post(`/friends/request/accept/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequestsReceived'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (error) => {
      console.error('Error accepting friend request:', error);
      // Handle error
    },
  });
};

// Mutation to reject a friend request
export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { requestId: string }>({
    mutationFn: async ({ requestId }) => {
      await axiosInstance.post(`/friends/request/reject/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequestsReceived'] });
    },
    onError: (error) => {
      console.error('Error rejecting friend request:', error);
      // Handle error
    },
  });
};

// Mutation to unfriend
export const useUnfriend = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { friendId: string }>({
    mutationFn: async ({ friendId }) => {
      await axiosInstance.delete(`/friends/friends/${friendId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.friendId] });
    },
    onError: (error) => {
      console.error('Error unfriending:', error);
    },
  });
};