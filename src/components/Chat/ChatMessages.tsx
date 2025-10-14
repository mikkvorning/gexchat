import { Box, Typography } from '../../app/muiImports';
import MarkdownMessage from './MarkdownMessage';
import { Message } from '../../types/types';
import { useChatEffects } from './hooks/useChatEffects';

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string | undefined;
}

const ChatMessages = ({ messages, currentUserId }: ChatMessagesProps) => {
  const { messagesEndRef, shouldAnimate } = useChatEffects({
    selectedChat: null, // We don't need selectedChat for animation logic
    messages,
    messageInputRef: { current: null }, // We don't need messageInputRef for animation logic
  });

  return (
    <Box
      sx={{ flex: 1, overflow: 'auto', p: 2, overflowX: 'hidden' }}
      className='chat-messages'
    >
      {messages.map((message, index) => {
        const isOwnMessage = message.senderId === currentUserId;

        // Use the shouldAnimate function passed from useChatEffects
        const animationClass = shouldAnimate(index)
          ? isOwnMessage
            ? 'new-message-own'
            : 'new-message-other'
          : '';

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
              <MarkdownMessage isOwnMessage={isOwnMessage}>
                {message.content}
              </MarkdownMessage>
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
