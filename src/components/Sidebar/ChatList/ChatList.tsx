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
} from '../utils/chatListUtils';
import { ChatSummary } from '../../../types/types';

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
    const hasUnread = chat.unreadCount > 0;

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
	const { setSelectedChat, selectedChat } = useAppContext();

	// Memoize user ID to prevent unnecessary hook re-renders
	const currentUserId = useMemo(() => user?.uid, [user?.uid]);

	// Use custom hook for data and state management
	const { chats, userColors, isLoading, error, resetLocalUnreadCount } =
		useChatList(currentUserId, selectedChat ?? undefined);

	// Memoize the chat selection handler
	const handleChatSelect = useCallback(
		async (chatId: string) => {
			setSelectedChat(chatId);
			if (currentUserId) {
				// Optimistically reset unread count client-side
				if (resetLocalUnreadCount) resetLocalUnreadCount(chatId);
				// Also reset in Firestore
				import('@/lib/chatService').then(({ resetUnreadCount }) => {
					resetUnreadCount(chatId, currentUserId);
				});
			}
		},
		[setSelectedChat, currentUserId, resetLocalUnreadCount]
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
