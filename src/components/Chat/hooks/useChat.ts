import { useQuery } from '@tanstack/react-query';
import { getChat, getChatMessages } from '../../../lib/chatService';

/**
 * Custom hook for fetching chat data and messages
 */
export const useChat = (chatId: string | null) => {
  // Get chat data
  const {
    data: chat,
    isLoading: chatLoading,
    error: chatError,
  } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => getChat(chatId!),
    enabled: !!chatId,
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
  });

  return {
    chat,
    messages,
    isLoading: chatLoading || messagesLoading,
    error: chatError || messagesError,
  };
};
