import { Box, Typography } from '../../app/muiImports';
import { mockChats, mockMessages, mockContacts } from '../../mock/mockData';

interface ChatProps {
  selectedContactId?: string;
}

const Chat = ({ selectedContactId }: ChatProps) => {
  if (!selectedContactId) {
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
          Select a contact to start chatting
        </Typography>
      </Box>
    );
  }

  const chat = mockChats.find(
    (c) =>
      c.type === 'direct' &&
      c.participants.some((p) => p.userId === selectedContactId)
  );

  const contact = mockContacts.find((c) => c.id === selectedContactId);
  const messages = chat ? mockMessages[chat.id] : [];

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
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        {/* We'll implement the ChatInput component later */}
      </Box>
    </Box>
  );
};

export default Chat;
