import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getChat,
  getChatMessages,
  subscribeToChat,
  subscribeToMessages,
} from '../../../lib/chatService';

/**
 * Custom hook for real-time chat data and messages using React Query + Firestore listeners
 */
export const useChat = (chatId: string | null) => {
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

  // Real-time updates that sync with React Query cache
  useEffect(() => {
    if (!chatId) return;

    const chatUnsubscribe = subscribeToChat(chatId, (chatData) => {
      queryClient.setQueryData(['chat', chatId], chatData);
    });

    const messagesUnsubscribe = subscribeToMessages(chatId, (messagesData) => {
      queryClient.setQueryData(['chatMessages', chatId], messagesData);
    });

    return () => {
      chatUnsubscribe?.();
      messagesUnsubscribe?.();
    };
  }, [chatId, queryClient]);

  return {
    chat,
    messages,
    isLoading: chatLoading || messagesLoading,
    error: chatError || messagesError,
  };
};
