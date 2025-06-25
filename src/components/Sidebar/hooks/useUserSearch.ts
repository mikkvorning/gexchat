import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface SearchResult {
  id: string;
  email: string;
  displayName: string;
  username: string;
}

/**
 * Custom hook for searching users in the database
 */
export const useUserSearch = (currentUserId: string | undefined) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Search users function
  const searchUsers = async (searchTerm: string, currentUserId: string) => {
    if (!searchTerm) return [];
    const usersRef = collection(db, 'users');
    // Query by username only
    const usernameQuery = query(
      usersRef,
      where('username', '>=', searchTerm),
      where('username', '<=', searchTerm + '\uf8ff')
    );
    const usernameSnap = await getDocs(usernameQuery);
    const results: SearchResult[] = [];
    usernameSnap.forEach((doc) => {
      if (doc.id !== currentUserId) {
        const data = doc.data() as {
          email: string;
          displayName: string;
          username: string;
        };
        results.push({
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          username: data.username,
        });
      }
    });
    return results;
  };

  // Search query
  const {
    data: searchResults = [],
    isLoading: searchLoading,
    error: searchError,
  } = useQuery<SearchResult[]>({
    queryKey: ['searchUsers', searchTerm, currentUserId],
    queryFn: () => searchUsers(searchTerm, currentUserId!),
    enabled: !!searchTerm && !!currentUserId,
  });

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    searchLoading,
    searchError,
  };
};
