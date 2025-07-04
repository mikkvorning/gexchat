import React, { useMemo, useCallback } from 'react';
import {
  Avatar,
  List,
  ListItem,
  ListItemText,
  Typography,
  Badge,
  Box,
} from '../../../app/muiImports';
import { useAuth } from '../../AuthProvider';
import { useAppContext } from '../../AppProvider';
import { useChatList } from '../hooks/useChatList';
import {
  getChatDisplayName,
  getChatAvatarProps,
  formatLastMessage,
  formatTimestamp,
  markChatAsRead,
} from './chatListUtils';
import { ChatSummary } from '../../../types/types';
import { useQueryClient } from '@tanstack/react-query';

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
    chat,
    userColors,
    onChatSelect,
  }: {
    chat: ChatSummary;
    userColors: Record<string, string>;
    onChatSelect: (chatId: string) => void;
  }) => {
    const avatarProps = getChatAvatarProps(chat, userColors);
    const hasUnread =
      typeof chat.unreadCount === 'number' ? chat.unreadCount > 0 : true; // String values like "25+" always indicate unread messages

    const handleClick = useCallback(() => {
      onChatSelect(chat.chatId);
    }, [chat.chatId, onChatSelect]);

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
          badgeContent={chat.unreadCount}
          color='primary'
          invisible={!hasUnread}
          sx={{
            mr: 2,
            '& .MuiBadge-badge': {
              fontSize:
                typeof chat.unreadCount === 'string' ? '0.7rem' : '0.75rem',
              minWidth: typeof chat.unreadCount === 'string' ? '24px' : '20px',
              height: typeof chat.unreadCount === 'string' ? '24px' : '20px',
            },
          }}
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
                {getChatDisplayName(chat)}
              </Typography>
              {chat.lastMessage && (
                <Typography variant='caption' color='text.secondary'>
                  {formatTimestamp(chat.lastMessage.timestamp)}
                </Typography>
              )}
            </Box>
          }
          secondary={
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{
                fontWeight: hasUnread ? 'medium' : 'normal',
                opacity: hasUnread ? 1 : 0.7,
              }}
            >
              {formatLastMessage(chat)}
            </Typography>
          }
        />
      </ListItem>
    );
  }
);

ChatItem.displayName = 'ChatItem';

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { setSelectedChat } = useAppContext();
  const queryClient = useQueryClient();

  // Memoize user ID to prevent unnecessary hook re-renders
  const currentUserId = useMemo(() => user?.uid, [user?.uid]);

  // Use custom hook for data and state management
  const { chats, userColors, isLoading, error } = useChatList(currentUserId);

  // Memoize the chat selection handler
  const handleChatSelect = useCallback(
    async (chatId: string) => {
      setSelectedChat(chatId);

      // Mark messages as read when selecting a chat
      if (currentUserId) {
        await markChatAsRead(queryClient, chatId, currentUserId, (error) =>
          console.error('Failed to mark messages as read:', error)
        );
      }
    },
    [setSelectedChat, currentUserId, queryClient]
  );

  if (isLoading) {
    return <LoadingState message='Loading chats...' />;
  }

  if (error) {
    return <LoadingState message='Failed to load chats' />;
  }

  if (chats.length === 0) {
    return <LoadingState message='No chats yet. Start a conversation!' />;
  }

  return (
    <List>
      {chats.map((chat) => (
        <ChatItem
          key={chat.chatId}
          chat={chat}
          userColors={userColors}
          onChatSelect={handleChatSelect}
        />
      ))}
    </List>
  );
};

export default ChatList;
