import { useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserChats, subscribeToUserChats } from '../../../lib/chatService';
import { generateAvatarColor } from '../../../utils/colors';
import { ChatSummary } from '../../../types/types';

/**
 * Custom hook for real-time ChatList data and state management using React Query + Firestore listeners
 */
export const useChatList = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  // Initial fetch with React Query
  const {
    data: chats = [],
    isLoading,
    error,
  } = useQuery<ChatSummary[]>({
    queryKey: ['userChats', userId],
    queryFn: () => getUserChats(userId ?? ''),
    enabled: !!userId,
    staleTime: Infinity, // Never consider stale since we have real-time updates
  });

  // Real-time updates that sync with React Query cache
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserChats(userId, (chatsData) => {
      queryClient.setQueryData(['userChats', userId], chatsData);
    });

    return () => {
      unsubscribe?.();
    };
  }, [userId, queryClient]);

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
