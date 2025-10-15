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
      {typingParticipants.length > 0 && (
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <Box
            sx={{
              bgcolor: 'grey.800',
              color: 'text.primary',
              p: 2,
              borderRadius: 2,
              maxWidth: '70%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CircularProgress size={12} sx={{ mr: 1 }} />
            <Typography variant='body2'>
              {typingParticipants.length === 1
                ? `${typingParticipants[0].displayName} is typing...`
                : typingParticipants.length === 2
                ? `${typingParticipants[0].displayName} and ${typingParticipants[1].displayName} are typing...`
                : `${typingParticipants[0].displayName} and ${
                    typingParticipants.length - 1
                  } others are typing...`}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessages;
