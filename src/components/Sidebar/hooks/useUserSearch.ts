import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface SearchResult {
  id: string;
  email: string;
  displayName: string;
}

/**
 * Custom hook for searching users in the database
 */
export const useUserSearch = (currentUserId: string | undefined) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  // Memoize the enabled condition and query key to prevent unnecessary re-evaluations
  const isSearchEnabled = useMemo(() => {
    return (
      !!currentUserId &&
      !!debouncedSearchTerm &&
      debouncedSearchTerm.length >= 2
    );
  }, [currentUserId, debouncedSearchTerm]);

  const queryKey = useMemo(() => {
    return ['searchUsers', debouncedSearchTerm?.trim(), currentUserId];
  }, [debouncedSearchTerm, currentUserId]);

  // Search users function
  const searchUsers = useCallback(
    async (searchTerm: string, currentUserId: string) => {
      if (!searchTerm || searchTerm.length < 2) return []; // Minimum 2 characters
      const usersRef = collection(db, 'users');
      // Query by displayName only
      const displayNameQuery = query(
        usersRef,
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff'),
        limit(10) // Limit results to prevent excessive data transfer
      );
      const displayNameSnap = await getDocs(displayNameQuery);
      const results: SearchResult[] = [];
      displayNameSnap.forEach((doc) => {
        if (doc.id !== currentUserId) {
          const data = doc.data() as {
            email: string;
            displayName: string;
          };
          results.push({
            id: doc.id,
            email: data.email,
            displayName: data.displayName,
          });
        }
      });
      return results;
    },
    []
  );

  // Search query
  const {
    data: searchResults = [],
    isLoading: searchLoading,
    error: searchError,
  } = useQuery<SearchResult[]>({
    queryKey,
    queryFn: () => searchUsers(debouncedSearchTerm, currentUserId!),
    enabled: isSearchEnabled,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    searchLoading,
    searchError,
  };
};
