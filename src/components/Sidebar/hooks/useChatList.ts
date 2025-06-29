import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserChats } from '../../../lib/chatService';
import { generateAvatarColor } from '../../../utils/colors';
import { ChatSummary } from '../../../types/types';

/**
 * Custom hook for ChatList data using React Query cache (updated via active chat listeners)
 */
export const useChatList = (userId: string | undefined) => {
  // Rely on React Query cache - updated by active chat message listeners
  const {
    data: chats = [],
    isLoading,
    error,
  } = useQuery<ChatSummary[]>({
    queryKey: ['userChats', userId],
    queryFn: () => getUserChats(userId ?? ''),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - allow some staleness since active chats update the cache
    refetchOnWindowFocus: true, // Refetch when window gains focus to catch missed updates
  });

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
