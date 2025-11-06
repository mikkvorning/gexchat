import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptChat, rejectChat } from '@/lib/chatService';

type ChatInvitationAction = 'accept' | 'reject';

interface ChatInvitationParams {
  chatId: string;
  userId: string;
  action: ChatInvitationAction;
}

export const useHandleChatInvitation = () => {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: acceptChat,
    onSuccess: ({ chatId }) => {
      // Invalidate chat queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error) => {
      console.error('Failed to accept chat:', error);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectChat,
    onSuccess: ({ chatId }) => {
      // Invalidate chat queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error) => {
      console.error('Failed to reject chat:', error);
    },
  });

  const handleInvitation = ({
    chatId,
    userId,
    action,
  }: ChatInvitationParams) => {
    if (action === 'accept') {
      acceptMutation.mutate({ chatId, userId });
    } else if (action === 'reject') {
      rejectMutation.mutate({ chatId, userId });
    }
  };

  return {
    handleInvitation,
    isAcceptPending: acceptMutation.isPending,
    isRejectPending: rejectMutation.isPending,
    isPending: acceptMutation.isPending || rejectMutation.isPending,
    acceptError: acceptMutation.error,
    rejectError: rejectMutation.error,
    error: acceptMutation.error || rejectMutation.error,
  };
};
