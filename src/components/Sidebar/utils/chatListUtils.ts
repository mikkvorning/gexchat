import { shouldUseWhiteText } from '../../../utils/colors';
import { ChatSummary } from '../../../types/types';

/**
 * Utility functions for ChatList display logic
 */

export const getChatDisplayName = (chat: ChatSummary): string => {
  if (chat.type === 'group' && chat.name) {
    return chat.name;
  }
  if (chat.otherParticipants.length > 0) {
    return chat.otherParticipants[0].displayName;
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
    return {
      sx: {
        bgcolor: color,
        color: shouldUseWhiteText(color) ? 'white' : 'black',
      },
      children: participant.displayName[0].toUpperCase(),
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
