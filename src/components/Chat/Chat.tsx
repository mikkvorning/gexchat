import { Box, Paper, TextField, Typography } from '../../app/muiImports';
import { mockChats, mockMessages, mockContacts } from '../../mock/mockData';
import { useEffect, useRef } from 'react';

interface ChatProps {
  selectedChatId?: string;
}

const Chat = ({ selectedChatId }: ChatProps) => {
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Focus the message input when a chat is selected
  useEffect(() => {
    if (selectedChatId && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [selectedChatId]);

  if (!selectedChatId) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {' '}
        <Typography variant='h6' color='text.secondary'>
          Select a chat to start chatting
        </Typography>
      </Box>
    );
  }

  // Find chat by ID
  const chat = mockChats.find((c) => c.id === selectedChatId);

  if (!chat) {
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
    (p) => p.userId !== 'lawyer' // Assuming current user is 'lawyer'
  );
  const contact = mockContacts.find((c) => c.id === otherParticipant?.userId);
  const messages = mockMessages[chat.id] || [];

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
        <Typography variant='h6'>{contact?.displayName}</Typography>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ marginLeft: 'auto' }}
        >
          {contact?.status}
        </Typography>
      </Box>

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
                message.senderId === 'lawyer' ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                bgcolor:
                  message.senderId === 'lawyer' ? 'primary.main' : 'grey.800',
                color:
                  message.senderId === 'lawyer'
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
      </Box>

      {/* Chat input */}
      <Paper
        sx={{
          borderRadius: 0,
          p: 2,
        }}
      >
        {' '}
        <TextField
          ref={messageInputRef}
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
