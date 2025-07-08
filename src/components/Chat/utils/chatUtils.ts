import { Chat, Message } from '../../../types/types';

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

  return otherParticipant ? 'Direct Chat' : 'Unknown Chat';
};

export const getOtherParticipant = (
  chat: Chat,
  currentUserId: string | undefined
) => {
  return chat.participants.find((p) => p.userId !== currentUserId);
};

/**
 * Determines if a message should be animated based on unread status
 * @param message - The message to check
 * @param currentUserId - The current user's ID
 * @param unreadMessages - Array of unread message IDs for the current user
 * @returns Object with shouldAnimate flag and animation class name
 */
export const getMessageAnimationInfo = (
  message: Message,
  currentUserId: string | undefined,
  unreadMessages: string[] = []
) => {
  if (!currentUserId) {
    return { shouldAnimate: false, animationClass: '' };
  }

  // Check if this message is in the user's unread messages array
  const isUnread = unreadMessages.includes(message.id);

  // Don't animate messages from the current user (they don't need to "receive" their own messages)
  const isOwnMessage = message.senderId === currentUserId;

  // Only animate unread messages from other users
  const shouldAnimate = isUnread && !isOwnMessage;

  const animationClass = shouldAnimate
    ? isOwnMessage
      ? 'new-message-own'
      : 'new-message-other'
    : '';

  return { shouldAnimate, animationClass };
};
