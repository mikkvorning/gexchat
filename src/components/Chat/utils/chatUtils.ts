import { Chat } from '../../../types/types';

/**
 * Utility functions for chat display logic
 */
export const getChatDisplayName = (
  chat: Chat,
  currentUserId: string | undefined
): string => {
  if (chat.type === 'group' && chat.name) {
    return chat.name;
  }

  // For direct chats, find the other participant
  const otherParticipant = chat.participants.find(
    (p) => p.userId !== currentUserId
  );

  return otherParticipant?.username || 'Unknown User';
};

export const getOtherParticipant = (
  chat: Chat,
  currentUserId: string | undefined
) => {
  return chat.participants.find((p) => p.userId !== currentUserId);
};
