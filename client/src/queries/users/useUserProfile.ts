// client/src/queries/users/useUserProfile.ts

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance'; // Assuming you have this configured

// Define a type for friendship status
export type FriendshipStatus = 'FRIEND' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NONE';

interface UserProfile {
  id: string;
  name: string;
  bio?: string | null;
  // Add all other relevant profile fields here that your backend returns
  // e.g., coverImageUrl, profileImageUrl, workExperiences, educationExperiences, etc.
  coverImageUrl?: string | null; // Added based on Profile.tsx usage
  profileImageUrl?: string | null; // Added based on Profile.tsx usage
  workExperiences?: Array<{
    id: string;
    company: string;
    position?: string | null;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    isCurrent?: boolean;
  }>;
  educationExperiences?: Array<{
    id: string;
    institution: string;
    degree?: string | null;
    fieldOfStudy?: string | null;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  // Note: Your Prisma schema uses currentCity and pastCities (string arrays) directly on User,
  // not a separate 'PlacesLived' model. Adjusting this based on your schema.
  currentCity?: string | null;
  pastCities?: string[] | null;

  email?: string | null; // Keep if your backend sends it, though typically user profile might omit for privacy
  contactPhoneNumber?: string | null; // Matches schema
  contactEmail?: string | null;     // Matches schema
  website?: string | null;           // Matches schema
  socialLinks?: string[] | null;     // Matches schema (array of strings)
  gender?: string | null;            // Matches schema (string for enum)
  dateOfBirth?: string | Date | null; // Matches schema, can be string from API or Date object
  maritalStatus?: string | null;     // Matches schema (string for enum)
  pronouns?: string | null;          // Matches schema
  languages?: string[] | null;       // Matches schema (array of strings)

  // This is the crucial addition for the frontend logic
  friendshipStatus?: FriendshipStatus;
  // **CRUCIAL ADDITIONS**: These IDs are now sent by your backend
  pendingIncomingRequestId?: string | null; // ID of the request received by the current user from this profile
  pendingOutgoingRequestId?: string | null; // ID of the request sent by the current user to this profile
}

export const useUserProfile = (userId: string | undefined) => {
  return useQuery<UserProfile, Error>({
    queryKey: ['userProfile', userId], // Query key includes userId for unique caching
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required to fetch profile.');
      }
      // Ensure your backend endpoint at `/users/${userId}` returns the UserProfile
      // object including the `friendshipStatus` and the new `pending*RequestId` properties.
      const response = await axiosInstance.get(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId, // Only run query if userId is available
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  });
};