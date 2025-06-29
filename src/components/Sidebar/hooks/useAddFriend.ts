import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFriend } from '../../../lib/chatService';

/**
 * Custom hook for adding friends/contacts
 */
export const useAddFriend = (currentUserId: string | undefined) => {
  const queryClient = useQueryClient();

  const addFriendMutation = useMutation({
    mutationFn: (friendId: string) => addFriend(currentUserId!, friendId),
    onSuccess: () => {
      // Invalidate to trigger refetch, real-time listeners will handle the rest
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
    },
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
