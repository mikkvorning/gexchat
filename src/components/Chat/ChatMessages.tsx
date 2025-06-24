import { Box, Typography } from '../../app/muiImports';
import { Message } from '../../types/types';

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatMessages = ({
  messages,
  currentUserId,
  messagesEndRef,
}: ChatMessagesProps) => {
  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
      {messages.map((message) => (
        <Box
          key={message.id}
          sx={{
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems:
              message.senderId === currentUserId ? 'flex-end' : 'flex-start',
          }}
        >
          <Box
            sx={{
              bgcolor:
                message.senderId === currentUserId
                  ? 'primary.main'
                  : 'grey.800',
              color:
                message.senderId === currentUserId
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
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessages;
