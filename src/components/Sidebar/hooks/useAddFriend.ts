import { useMutation } from '@tanstack/react-query';
import { addFriend } from '../../../lib/chatService';

/**
 * Custom hook for adding friends/contacts
 */
export const useAddFriend = (currentUserId: string | undefined) => {
  const addFriendMutation = useMutation({
    mutationFn: (friendId: string) => addFriend(currentUserId!, friendId),
    onError: (error) => {
      console.error('Failed to add friend:', error);
    },
  });

  return {
    addFriend: addFriendMutation.mutate,
    isAddingFriend: addFriendMutation.isPending,
    addFriendError: addFriendMutation.error,
  };
};
