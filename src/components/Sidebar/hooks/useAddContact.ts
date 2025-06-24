import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { createChat, addFriend } from '../../../lib/chatService';

interface SearchResult {
  id: string;
  email: string;
  displayName: string;
}

/**
 * Custom hook for AddContact search and contact management functionality
 */
export const useAddContact = (
  currentUserId: string | undefined,
  onClose: () => void
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

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
        };
        results.push({
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
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

  // Create chat mutation
  const createChatMutation = useMutation({
    mutationFn: (participantId: string) =>
      createChat(
        {
          type: 'direct',
          participantIds: [participantId],
        },
        currentUserId!
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
      onClose();
    },
    onError: (error) => {
      console.error('Failed to create chat:', error);
    },
  });

  // Add friend mutation
  const addFriendMutation = useMutation({
    mutationFn: (friendId: string) => addFriend(currentUserId!, friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    },
    onError: (error) => {
      console.error('Failed to add friend:', error);
    },
  });

  const handleStartChat = (participantId: string) => {
    createChatMutation.mutate(participantId);
  };

  const handleAddFriend = (friendId: string) => {
    addFriendMutation.mutate(friendId);
  };

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    searchLoading,
    searchError,
    createChatMutation,
    addFriendMutation,
    handleStartChat,
    handleAddFriend,
  };
};
