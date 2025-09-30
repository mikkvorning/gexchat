import React, { useCallback, useMemo } from 'react';
import { GeminiBot } from './GeminiBot';
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
import { useAuthContext } from '../../AuthProvider';
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
  const { user } = useAuthContext();
  const { setSelectedChat, selectedChat, filterChats, searchValue } =
    useAppContext();

  // Memoize user ID to prevent unnecessary hook re-renders
  const currentUserId = useMemo(() => user?.uid, [user?.uid]);

  // Use custom hook for data and state management
  const { chatSummaries, userColors, isLoading, error } = useChatList(
    currentUserId,
    selectedChat ?? undefined
  );

  // Apply search filter to chat summaries
  const filteredChatSummaries = useMemo(
    () => filterChats(chatSummaries),
    [filterChats, chatSummaries]
  );

  // Memoize the chat selection handler
  const handleChatSelect = useCallback(
    async (newChatId: string) => {
      if (currentUserId) {
        // Dynamic import to avoid initial load for chats that are never actually selected
        import('@/lib/chatService').then(({ resetUnreadCount }) => {
          resetUnreadCount([selectedChat, newChatId], currentUserId);
        });
      }

      setSelectedChat(newChatId);
    },
    [selectedChat, setSelectedChat, currentUserId]
  );

  // Gemini-bot static item handler
  if (error) return <LoadingState message='Failed to load chats' />;

  return (
    <>
      <Box height={4}>{isLoading && <LinearProgress color='primary' />}</Box>
      <List>
        {/* Gemini bot handles its own visibility based on search */}
        <GeminiBot onChatSelect={handleChatSelect} searchValue={searchValue} />
        {/* Render normal chats below */}
        {filteredChatSummaries.map((summary) => (
          <ChatItem
            key={summary.summaryId}
            chatSummary={summary}
            userColors={userColors}
            onChatSelect={handleChatSelect}
          />
        ))}
        {/* Show message when no chats found in search */}
        {filteredChatSummaries.length === 0 && chatSummaries.length > 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              No chats found matching your search.
            </Typography>
          </Box>
        )}
        {/* Show message when no chats at all */}
        {chatSummaries.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Search for users above in order to start new chats!
            </Typography>
          </Box>
        )}
      </List>
    </>
  );
};

export default ChatList;
