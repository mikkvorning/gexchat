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
import { useQuery } from '@tanstack/react-query';
import { getUserChats } from '../../../lib/chatService';
import { useAuth } from '../../AuthProvider';
import { shouldUseWhiteText, generateAvatarColor } from '../../../utils/colors';
import { ChatSummary } from '../../../types/types';
import { useAppContext } from '../../AppProvider';

const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { setSelectedChat } = useAppContext();

  const {
    data: chats = [],
    isLoading,
    error,
  } = useQuery<ChatSummary[]>({
    queryKey: ['userChats', user?.uid],
    queryFn: () => getUserChats(user?.uid ?? ''),
    enabled: !!user?.uid,
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

  const getChatDisplayName = (chat: ChatSummary): string => {
    if (chat.type === 'group' && chat.name) {
      return chat.name;
    }
    if (chat.otherParticipants.length > 0) {
      return chat.otherParticipants[0].displayName;
    }
    return 'Unknown Chat';
  };

  const getChatAvatar = (chat: ChatSummary) => {
    if (chat.type === 'group') {
      return (
        <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>G</Avatar>
      );
    }

    if (chat.otherParticipants.length > 0) {
      const participant = chat.otherParticipants[0];
      const color = userColors[participant.id];
      return (
        <Avatar
          sx={{
            bgcolor: color,
            color: shouldUseWhiteText(color) ? 'white' : 'black',
          }}
        >
          {participant.displayName[0].toUpperCase()}
        </Avatar>
      );
    }

    return <Avatar>?</Avatar>;
  };
  const formatLastMessage = (chat: ChatSummary): string => {
    if (!chat.lastMessage) return 'No messages yet';

    const content = chat.lastMessage.content;
    return content.length > 50 ? `${content.substring(0, 50)}...` : content;
  };
  const formatTimestamp = (date: Date): string => {
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
      {chats.map((chat) => (
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
            {getChatAvatar(chat)}
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
                  sx={{ fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal' }}
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
      ))}{' '}
    </List>
  );
};

export default ChatList;
