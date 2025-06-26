import React, { useMemo } from 'react';
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
import { useChatList } from '../hooks';
import {
  getChatDisplayName,
  getChatAvatarProps,
  formatLastMessage,
  formatTimestamp,
} from '../utils';

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { setSelectedChat } = useAppContext();

  // Memoize user ID to prevent unnecessary hook re-renders
  const currentUserId = useMemo(() => user?.uid, [user?.uid]);

  // Use custom hook for data and state management
  const { chats, userColors, isLoading, error } = useChatList(currentUserId);

  if (isLoading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant='body2' color='text.secondary'>
          Loading chats...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant='body2' color='error'>
          Failed to load chats
        </Typography>
      </Box>
    );
  }

  if (chats.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant='body2' color='text.secondary'>
          No chats yet. Start a conversation!
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {chats.map((chat) => {
        const avatarProps = getChatAvatarProps(chat, userColors);
        return (
          <ListItem
            key={chat.chatId}
            onClick={() => setSelectedChat(chat.chatId)}
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
              invisible={chat.unreadCount === 0}
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
                      fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal',
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
                    fontWeight: chat.unreadCount > 0 ? 'medium' : 'normal',
                    opacity: chat.unreadCount > 0 ? 1 : 0.7,
                  }}
                >
                  {formatLastMessage(chat)}
                </Typography>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
};

export default ChatList;
