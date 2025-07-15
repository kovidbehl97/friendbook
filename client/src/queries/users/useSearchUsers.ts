// client/src/queries/users/useSearchUsers.ts
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import { useState, useEffect } from 'react';

// You might already have this type defined elsewhere
export interface UserSearchResult {
  id: string;
  name: string;
  profileImageUrl?: string | null;
}

const searchUsersApi = async (query: string): Promise<UserSearchResult[]> => {
  if (!query) {
    return [];
  }
  const { data } = await axiosInstance.get(`/users/search?q=${query}`);
  return data;
};

// Custom hook to search users with a debounce function
export const useSearchUsers = (searchTerm: string) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce the search term to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  return useQuery<UserSearchResult[]>({
    queryKey: ['users', 'search', debouncedSearchTerm],
    queryFn: () => searchUsersApi(debouncedSearchTerm),
    // Only run the query if there is a debounced search term
    enabled: !!debouncedSearchTerm,
  });
};