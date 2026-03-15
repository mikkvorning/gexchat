import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import Fuse from 'fuse.js';
import { db } from '../../../lib/firebase';
import { OnlineStatus } from '@/types/types';

// Normalized user data returned from the search hook
interface SearchResult {
  id: string;
  username: string;
  displayName: string;
  createdAt: { toDate(): Date };
  status: OnlineStatus;
}

// Firestore fields we search against for initial candidates

// Custom hook for searching users in Firestore by username and display name
export const useUserSearch = (currentUserId: string | undefined) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 800);

  // Only enable the query when we have a user and a sufficiently long term
  const isSearchEnabled = useMemo(() => {
    return (
      !!currentUserId &&
      !!debouncedSearchTerm &&
      debouncedSearchTerm.length >= 2
    );
  }, [currentUserId, debouncedSearchTerm]);

  // Stable React Query key based on current term and user
  const queryKey = useMemo(() => {
    return ['searchUsers', debouncedSearchTerm?.trim(), currentUserId];
  }, [debouncedSearchTerm, currentUserId]);

  // Search users function
  const searchUsers = useCallback(
    async (searchTerm: string, currentUserId: string) => {
      if (!searchTerm || searchTerm.length < 3) return []; // Minimum 3 characters

      // Fetch a bounded set of users; Fuse will handle fuzzy matching
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, limit(100));
      const usersSnap = await getDocs(usersQuery);

      const candidates: SearchResult[] = [];

      usersSnap.forEach((doc) => {
        if (doc.id !== currentUserId) {
          const data = doc.data();
          candidates.push({
            id: doc.id,
            username: data.username,
            displayName: data.displayName,
            createdAt: data.createdAt,
            status: data.status,
          });
        }
      });

      // Short-circuit if there's nothing to rank
      if (!candidates.length) return [];

      // Use Fuse to rank candidates by fuzzy match on username and display name
      // Tuned for substring-like matches (>= 3 chars) without being overly fuzzy
      const fuse = new Fuse<SearchResult>(candidates, {
        keys: [
          { name: 'username', weight: 0.6 },
          { name: 'displayName', weight: 0.4 },
        ],
        threshold: 0.2,
        // Use location-aware scoring and require at least 3 consecutive chars
        ignoreLocation: false,
        minMatchCharLength: 3,
      });

      const trimmedTerm = searchTerm.trim();
      if (!trimmedTerm) return candidates;

      const fuseResults = fuse.search(trimmedTerm);

      // Return ranked items, keep a reasonable cap on the number of results
      return fuseResults.slice(0, 20).map((result) => result.item);
    },
    [],
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
