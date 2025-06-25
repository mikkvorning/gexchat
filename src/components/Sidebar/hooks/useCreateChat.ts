import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChat } from '../../../lib/chatService';

/**
 * Custom hook for creating chats with users
 */
export const useCreateChat = (
  currentUserId: string | undefined,
  currentUsername: string | undefined,
  onSuccess?: (chatId: string) => void
) => {
  const queryClient = useQueryClient();

  const createChatMutation = useMutation({
    mutationFn: (participantUsernames: { [userId: string]: string }) =>
      createChat(
        {
          type: 'direct',
          participantIds: Object.keys(participantUsernames).filter(
            (id) => id !== currentUserId
          ),
          participantUsernames,
        },
        currentUserId!
      ),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
      onSuccess?.(response.chatId);
    },
    onError: (error) => {
      console.error('Failed to create chat:', error);
    },
  });

  const startChat = (participantId: string, participantUsername: string) => {
    const participantUsernames: { [userId: string]: string } = {
      [participantId]: participantUsername,
    };

    // Add current user's username if available
    if (currentUserId && currentUsername) {
      participantUsernames[currentUserId] = currentUsername;
    }

    createChatMutation.mutate(participantUsernames);
  };

  return {
    startChat,
    isCreatingChat: createChatMutation.isPending,
    createChatError: createChatMutation.error,
  };
};
