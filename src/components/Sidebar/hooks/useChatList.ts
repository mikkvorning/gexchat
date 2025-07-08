import { useMemo, useState, useEffect } from 'react';
import { subscribeToUserChats } from '../../../lib/chatService';
import { generateAvatarColor } from '../../../utils/colors';
import { ChatSummary } from '../../../types/types';

/**
 * Custom hook for ChatList data using real-time Firestore subscriptions
 */
export const useChatList = (userId: string | undefined) => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setChats([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Subscribe to real-time chat updates
    const unsubscribe = subscribeToUserChats(userId, (updatedChats) => {
      console.log(
        'Chat list updated:',
        updatedChats.map((chat) => ({
          id: chat.chatId,
          unreadCount: chat.unreadCount,
        }))
      );
      setChats(updatedChats);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount or userId change
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Generate stable color mappings for users
  const userColors = useMemo(() => {
    const colors: Record<string, string> = {};
    chats.forEach((chat) => {
      chat.otherParticipants.forEach((participant) => {
        if (!colors[participant.id]) {
          colors[participant.id] = generateAvatarColor(participant.id);
        }
      });
    });
    return colors;
  }, [chats]);

  return {
    chats,
    userColors,
    isLoading,
    error,
  };
};
