// client/src/queries/users/useCurrentUser.ts
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';

export type MaritalStatus = 'SINGLE' | 'IN_RELATIONSHIP' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'COMPLICATED';
export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY' | 'CUSTOM';

export interface User {
  id: string;
  name: string; // This is definitely present
  email: string;
  bio: string | null; // Can be null
  createdAt: string; // ISO Date string

  profileImageUrl: string | null; // Can be null
  coverImageUrl: string | null; // Can be null

  currentWorkplace: string | null; // Can be null
  hometown: string | null; // Can be null
  studiedAt: string | null; // Can be null
  maritalStatus: MaritalStatus | null; // Can be null

  contactPhoneNumber: string | null; // Can be null
  contactEmail: string | null; // Can be null
  website: string | null; // Can be null
  socialLinks: string[]; // Can be empty array, but always an array

  currentCity: string | null; // Can be null
  pastCities: string[]; // Can be empty array, but always an array

  gender: Gender | null; // Can be null
  pronouns: string | null; // Can be null
  dateOfBirth: string | null; // Can be null (as ISO Date string)
  languages: string[]; // Can be empty array, but always an array

  workExperiences: Array<{
    id: string;
    userId: string; // Added this as per your schema, though you might not always need it on the frontend
    company: string;
    position: string | null; // Can be null
    description: string | null; // Can be null
    startDate: string | null; // Can be null
    endDate: string | null; // Can be null
    isCurrent: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  educationExperiences: Array<{
    id: string;
    userId: string; // Added this as per your schema
    institution: string;
    degree: string | null; // Can be null
    fieldOfStudy: string | null; // Can be null
    description: string | null; // Can be null
    startDate: string | null; // Can be null
    endDate: string | null; // Can be null
    createdAt: string;
    updatedAt: string;
  }>;
}

const fetchCurrentUser = async (): Promise<User> => {
  const accessToken = sessionStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('No authentication token found.');
  }

  try {
    const { data } = await axiosInstance.get('/auth/me');
    // You can add a console.log here to confirm the data structure received by the hook
    // console.log("Received data in fetchCurrentUser:", data);
    return data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
};

export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    enabled: typeof window !== 'undefined' && !!sessionStorage.getItem('accessToken'),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};