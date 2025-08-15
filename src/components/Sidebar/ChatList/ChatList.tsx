import React, { useCallback, useMemo } from 'react';
import {
  Avatar,
  Badge,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '../../../app/muiImports';
import { ChatSummary } from '../../../types/types';
import { useAppContext } from '../../AppProvider';
import { useAuth } from '../../AuthProvider';
import { useChatList } from '../hooks/useChatList';
import {
  formatLastMessage,
  formatTimestamp,
  getChatAvatarProps,
  getChatDisplayName,
} from '../utils/chatListUtils';

// Loading state component
const LoadingState = ({ message }: { message: string }) => (
  <Box sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant='body2' color='text.secondary'>
      {message}
    </Typography>
  </Box>
);

// Individual chat item component
const ChatItem = React.memo(
  ({
    chatSummary,
    userColors,
    onChatSelect,
  }: {
    chatSummary: ChatSummary;
    userColors: Record<string, string>;
    onChatSelect: (chatId: string) => void;
  }) => {
    const avatarProps = getChatAvatarProps(chatSummary, userColors);
    const hasUnread = chatSummary.unreadCount > 0;

    const handleClick = useCallback(() => {
      onChatSelect(chatSummary.summaryId);
    }, [chatSummary.summaryId, onChatSelect]);

    // Only show preview if there are unread messages and a last message

    const timeStamp =
      chatSummary.lastMessage?.timestamp && chatSummary.unreadCount > 0 ? (
        <Typography variant='caption' color='text.secondary'>
          {formatTimestamp(chatSummary.lastMessage.timestamp)}
        </Typography>
      ) : null;

    const preview =
      hasUnread && chatSummary.lastMessage ? (
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{
            fontWeight: 'medium',
            opacity: 1,
          }}
        >
          {formatLastMessage(chatSummary)}
        </Typography>
      ) : null;

    return (
      <ListItem
        onClick={handleClick}
        sx={{
          borderRadius: 1,
          cursor: 'pointer',
          py: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <Badge
          badgeContent={chatSummary.unreadCount}
          color='primary'
          invisible={!hasUnread}
          sx={{ mr: 2 }}
        >
          <Avatar sx={avatarProps.sx}>{avatarProps.children}</Avatar>
        </Badge>
        <ListItemText
          primary={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                variant='subtitle2'
                sx={{
                  fontWeight: hasUnread ? 'bold' : 'normal',
                }}
              >
                {getChatDisplayName(chatSummary)}
              </Typography>
              {timeStamp}
            </Box>
          }
          secondary={preview}
        />
      </ListItem>
    );
  }
);

ChatItem.displayName = 'ChatItem';

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { setSelectedChat, selectedChat } = useAppContext();

  // Memoize user ID to prevent unnecessary hook re-renders
  const currentUserId = useMemo(() => user?.uid, [user?.uid]);

  // Use custom hook for data and state management
  const { chatSummaries, userColors, isLoading, error, resetLocalUnreadCount } =
    useChatList(currentUserId, selectedChat ?? undefined);

  // Memoize the chat selection handler
  const handleChatSelect = useCallback(
    async (chatId: string) => {
      setSelectedChat(chatId);
      if (currentUserId) {
        // Optimistically reset unread count client-side
        if (resetLocalUnreadCount) resetLocalUnreadCount(chatId);
        // Dynamic import to avoid initial load for chats that are never actually selected
        import('@/lib/chatService').then(({ resetUnreadCount }) => {
          resetUnreadCount(chatId, currentUserId);
        });
      }
    },
    [setSelectedChat, currentUserId, resetLocalUnreadCount]
  );

  if (isLoading) {
    return (
      <>
        <LinearProgress color='primary' />
        <LoadingState message='Loading chats...' />
      </>
    );
  }

  if (error) {
    return <LoadingState message='Failed to load chats' />;
  }

  if (chatSummaries.length === 0) {
    return (
      <LoadingState message='Search for users above in order to start new chats!' />
    );
  }

  return (
    <List>
      {chatSummaries.map((summary) => (
        <ChatItem
          key={summary.summaryId}
          chatSummary={summary}
          userColors={userColors}
          onChatSelect={handleChatSelect}
        />
      ))}
    </List>
  );
};

export default ChatList;
