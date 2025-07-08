import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getChat,
  getChatMessages,
  subscribeToChatView,
  markMessagesAsRead,
} from '../../../lib/chatService';

/**
 * Custom hook for real-time chat data and messages using React Query + Firestore listeners
 */
export const useChat = (chatId: string | null, userId: string | undefined) => {
  const queryClient = useQueryClient();

  // Initial fetch with React Query (fast first load from cache)
  const {
    data: chat,
    isLoading: chatLoading,
    error: chatError,
  } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => getChat(chatId!),
    enabled: !!chatId,
    staleTime: Infinity, // Never consider stale since we have real-time updates
  });

  // Get chat messages
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: () => getChatMessages(chatId!),
    enabled: !!chatId,
    staleTime: Infinity, // Never consider stale since we have real-time updates
  });

  // Real-time updates and mark messages as read
  useEffect(() => {
    if (!chatId || !userId) return;

    // Mark all messages as read when entering the chat
    markMessagesAsRead(chatId, userId).catch((error) => {
      console.error('Failed to mark messages as read:', error);
    });

    // Set up real-time subscription using the consolidated function
    const unsubscribe = subscribeToChatView(
      chatId,
      (chatData) => {
        queryClient.setQueryData(['chat', chatId], chatData);
      },
      (messagesData) => {
        queryClient.setQueryData(['chatMessages', chatId], messagesData);
      }
    );

    return () => {
      unsubscribe?.();
    };
  }, [chatId, userId, queryClient]);

  return {
    chat,
    messages,
    isLoading: chatLoading || messagesLoading,
    error: chatError || messagesError,
  };
};
