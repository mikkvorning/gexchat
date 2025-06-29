import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createChat } from '../../../lib/chatService';

/**
 * Custom hook for creating chats with users
 */
export const useCreateChat = (
  currentUserId: string | undefined,
  onSuccess?: (chatId: string) => void
) => {
  const queryClient = useQueryClient();

  const createChatMutation = useMutation({
    mutationFn: (participantIds: string[]) =>
      createChat(
        {
          type: 'direct',
          participantIds: participantIds.filter((id) => id !== currentUserId),
        },
        currentUserId!
      ),
    onSuccess: (response) => {
      // Invalidate to trigger refetch, real-time listeners will handle the rest
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
      onSuccess?.(response.chatId);
    },
    onError: (error) => {
      console.error('Failed to create chat:', error);
    },
  });

  const startChat = (participantId: string) => {
    createChatMutation.mutate([participantId]);
  };

  return {
    startChat,
    isCreatingChat: createChatMutation.isPending,
    createChatError: createChatMutation.error,
  };
};
