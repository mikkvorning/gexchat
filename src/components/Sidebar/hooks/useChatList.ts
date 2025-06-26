import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserChats } from '../../../lib/chatService';
import { generateAvatarColor } from '../../../utils/colors';
import { ChatSummary } from '../../../types/types';

/**
 * Custom hook for ChatList data fetching and state management
 */
export const useChatList = (userId: string | undefined) => {
  const {
    data: chats = [],
    isLoading,
    error,
  } = useQuery<ChatSummary[]>({
    queryKey: ['userChats', userId],
    queryFn: () => getUserChats(userId ?? ''),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes (chats update more frequently)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
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
