import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptChatMutation, rejectChatMutation } from '@/lib/chatService';

export const useHandleChatInvitation = () => {
  const queryClient = useQueryClient();
  const acceptMutation = useMutation({
    mutationFn: acceptChatMutation,
    onSuccess: ({ chatId }) => {
      // Invalidate chat queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error) => console.error('Failed to accept chat:', error),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectChatMutation,
    onSuccess: ({ chatId }) => {
      // Invalidate chat queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error) => console.error('Failed to reject chat:', error),
  });

  const acceptChat = (chatId: string, userId: string) => {
    acceptMutation.mutate({ chatId, userId });
  };

  const rejectChat = (chatId: string, userId: string) => {
    rejectMutation.mutate({ chatId, userId });
  };

  return {
    acceptChat,
    rejectChat,
    isAcceptPending: acceptMutation.isPending,
    isRejectPending: rejectMutation.isPending,
    isPending: acceptMutation.isPending || rejectMutation.isPending,
    acceptError: acceptMutation.error,
    rejectError: rejectMutation.error,
    error: acceptMutation.error || rejectMutation.error,
  };
};
