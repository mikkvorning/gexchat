import { markMessagesAsRead } from '@/lib/chatService';
import { ChatSummary } from '@/types/types';
import { QueryClient } from '@tanstack/react-query';
import { shouldUseWhiteText } from '../../../utils/colors';

/**
 * Utility functions for ChatList display logic
 */

export const getChatDisplayName = (chat: ChatSummary): string => {
  if (chat.type === 'group' && chat.name) {
    return chat.name;
  }
  if (chat.otherParticipants.length > 0) {
    const participant = chat.otherParticipants[0];
    return participant.displayName || 'Unknown User';
  }
  return 'Unknown Chat';
};

export const getChatAvatarProps = (
  chat: ChatSummary,
  userColors: Record<string, string>
) => {
  if (chat.type === 'group') {
    return {
      sx: { bgcolor: 'primary.main', color: 'white' },
      children: 'G',
    };
  }

  if (chat.otherParticipants.length > 0) {
    const participant = chat.otherParticipants[0];
    const color = userColors[participant.id];
    const displayName = participant.displayName || 'Unknown';
    return {
      sx: {
        bgcolor: color,
        color: shouldUseWhiteText(color) ? 'white' : 'black',
      },
      children: displayName[0].toUpperCase(),
    };
  }

  return {
    sx: {},
    children: '?',
  };
};

export const formatLastMessage = (chat: ChatSummary): string => {
  if (!chat.lastMessage) return 'No messages yet';

  const content = chat.lastMessage.content;
  return content.length > 50 ? `${content.substring(0, 50)}...` : content;
};

export const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString();
};

/**
 * Marks a chat as read with immediate UI feedback.
 *
 * Updates the cache immediately for responsive UI, then performs the actual
 * database operation in the background. If the API call fails, the cache
 * is reverted to maintain data consistency.
 *
 * @param queryClient - The React Query client instance
 * @param chatId - The ID of the chat to mark as read
 * @param userId - The ID of the user marking messages as read
 * @param onError - Optional callback for handling errors
 *
 * @example
 * ```typescript
 * const handleChatSelect = useCallback(async (chatId: string) => {
 *   setSelectedChat(chatId);
 *
 *   if (currentUserId) {
 *     await markChatAsRead(
 *       queryClient,
 *       chatId,
 *       currentUserId,
 *       (error) => console.error('Failed to mark as read:', error)
 *     );
 *   }
 * }, [queryClient, currentUserId, setSelectedChat]);
 * ```
 */
export const markChatAsRead = async (
  queryClient: QueryClient,
  chatId: string,
  userId: string,
  onError?: (error: unknown) => void
): Promise<void> => {
  try {
    // Step 1: Update the cache immediately for responsive UI
    queryClient.setQueryData(
      ['userChats', userId],
      (oldChats: ChatSummary[] | undefined) => {
        if (!oldChats) return oldChats;

        return oldChats.map((chat) =>
          chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat
        );
      }
    );

    // Step 2: Perform the actual database operation in the background
    await markMessagesAsRead(chatId, userId);
  } catch (error) {
    // Step 3: If the API call fails, revert the cache update
    queryClient.invalidateQueries({ queryKey: ['userChats', userId] });

    // Call the error handler if provided
    if (onError) {
      onError(error);
    } else {
      console.error('Failed to mark messages as read:', error);
    }
  }
};

/**
 * Marks multiple chats as read with immediate UI feedback.
 * Useful for bulk operations like "mark all as read".
 *
 * @param queryClient - The React Query client instance
 * @param chatIds - Array of chat IDs to mark as read
 * @param userId - The ID of the user marking messages as read
 * @param onError - Optional callback for handling errors
 */
export const markMultipleChatsAsRead = async (
  queryClient: QueryClient,
  chatIds: string[],
  userId: string,
  onError?: (error: unknown) => void
): Promise<void> => {
  try {
    // Update the cache immediately for all specified chats
    queryClient.setQueryData(
      ['userChats', userId],
      (oldChats: ChatSummary[] | undefined) => {
        if (!oldChats) return oldChats;

        return oldChats.map((chat) =>
          chatIds.includes(chat.chatId) ? { ...chat, unreadCount: 0 } : chat
        );
      }
    );

    // Mark all chats as read in parallel
    await Promise.all(
      chatIds.map((chatId) => markMessagesAsRead(chatId, userId))
    );
  } catch (error) {
    // Revert all changes on error
    queryClient.invalidateQueries({ queryKey: ['userChats', userId] });

    if (onError) {
      onError(error);
    } else {
      console.error('Failed to mark multiple chats as read:', error);
    }
  }
};
