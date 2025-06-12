import { Box, Paper, TextField, Typography } from '../../app/muiImports';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChat, getChatMessages } from '../../lib/chatService';
import { useAuth } from '../AuthProvider';
import { useAppContext } from '../AppProvider';

const Chat = () => {
  const messageInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { selectedChat } = useAppContext();
  // Get chat data
  const {
    data: chat,
    isLoading: chatLoading,
    error: chatError,
  } = useQuery({
    queryKey: ['chat', selectedChat],
    queryFn: () => getChat(selectedChat!),
    enabled: !!selectedChat,
  });
  // Get chat messages
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ['chatMessages', selectedChat],
    queryFn: () => getChatMessages(selectedChat!),
    enabled: !!selectedChat,
  });

  // Focus the message input when a chat is selected
  useEffect(() => {
    if (selectedChat && messageInputRef.current) {
      // Small delay to ensure the UI has rendered
      const timeoutId = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedChat]);

  if (!selectedChat) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant='h6' color='text.secondary'>
          Select a chat to start chatting
        </Typography>
      </Box>
    );
  }

  if (chatLoading || messagesLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant='h6' color='text.secondary'>
          Loading chat...
        </Typography>
      </Box>
    );
  }

  if (chatError || messagesError || !chat) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant='h6' color='text.secondary'>
          Chat not found
        </Typography>
      </Box>
    );
  }

  // Get other participant for display name (for direct chats)
  const otherParticipant = chat.participants.find(
    (p) => p.userId !== user?.uid
  );

  // For now, we'll use the participant's user ID as display name
  // In a real app, you'd query the user document to get display name
  const displayName = otherParticipant?.userId || 'Unknown User';

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* Chat header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant='h6'>{displayName}</Typography>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ marginLeft: 'auto' }}
        >
          online
        </Typography>
      </Box>{' '}
      {/* Chat messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems:
                message.senderId === user?.uid ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                bgcolor:
                  message.senderId === user?.uid ? 'primary.main' : 'grey.800',
                color:
                  message.senderId === user?.uid
                    ? 'primary.contrastText'
                    : 'text.primary',
                p: 2,
                borderRadius: 2,
                maxWidth: '70%',
              }}
            >
              <Typography variant='body1'>{message.content}</Typography>
            </Box>
            <Typography variant='caption' color='text.secondary' m={1}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </Typography>
          </Box>
        ))}
      </Box>{' '}
      {/* Chat input */}
      <Paper
        sx={{
          borderRadius: 0,
          p: 2,
        }}
      >
        {' '}
        <TextField
          inputRef={messageInputRef}
          variant='outlined'
          placeholder='Type a message...'
          fullWidth
          multiline
          maxRows={4}
        />
      </Paper>
    </Box>
  );
};

export default Chat;
