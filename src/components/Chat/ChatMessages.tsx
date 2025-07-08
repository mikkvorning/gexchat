import { Box, Typography } from '../../app/muiImports';
import { Message } from '../../types/types';
import { getMessageAnimationInfo } from './utils/chatUtils';

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  unreadMessages?: string[]; // Array of unread message IDs for the current user
}

const ChatMessages = ({
  messages,
  currentUserId,
  messagesEndRef,
  unreadMessages = [],
}: ChatMessagesProps) => {
  return (
    <Box
      sx={{ flex: 1, overflow: 'auto', p: 2, overflowX: 'hidden' }}
      className='chat-messages'
    >
      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;

        // Use the utility function to determine animation
        const { animationClass } = getMessageAnimationInfo(
          message,
          currentUserId,
          unreadMessages
        );

        return (
          <Box
            key={message.id}
            className={animationClass}
            sx={{
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                bgcolor: isOwnMessage ? 'primary.main' : 'grey.800',
                color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
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
        );
      })}
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessages;
