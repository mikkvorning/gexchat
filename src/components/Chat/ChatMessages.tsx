import { Box, Typography, CircularProgress } from '../../app/muiImports';
import MarkdownMessage from './MarkdownMessage';
import { Message, Chat } from '../../types/types';
import { useChatEffects } from './hooks/useChatEffects';

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string | undefined;
  chat?: Chat; // Chat object containing participant typing states
}

const ChatMessages = ({ messages, currentUserId, chat }: ChatMessagesProps) => {
  const { messagesEndRef, shouldAnimate } = useChatEffects({
    selectedChat: null, // We don't need selectedChat for animation logic
    messages,
    messageInputRef: { current: null }, // We don't need messageInputRef for animation logic
  });

  // Derive typing participants from chat data
  const typingParticipants =
    chat?.participants.filter(
      (p) => p.isTyping && p.userId !== currentUserId
    ) || [];

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        p: 2,
        overflowX: 'hidden',
        position: 'relative',
      }}
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
                position: 'relative',
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

      {/* Typing indicators */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mt: -2,
          color: 'text.secondary',
        }}
      >
        {typingParticipants.length > 0 && (
          <>
            <CircularProgress size={12} sx={{ mr: 1 }} />
            <Typography variant='body2'>
              {typingParticipants.map((p) => p.displayName).join(', ')}
              {typingParticipants.length === 1 ? ' is' : ' are'} typing...
            </Typography>
          </>
        )}
      </Box>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessages;
