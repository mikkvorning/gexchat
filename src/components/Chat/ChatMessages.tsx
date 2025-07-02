import { Box, Typography } from '../../app/muiImports';
import { Message } from '../../types/types';
import { useEffect, useRef, useState } from 'react';

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
  const previousMessageCountRef = useRef(0);
  const chatIdRef = useRef<string | null>(null);
  const [previousCount, setPreviousCount] = useState(0);
  const isInitialLoadRef = useRef(true);

  // Track if this is a new message or just switching chats
  useEffect(() => {
    const currentChatId = messages[0]?.chatId;

    // If chat changed, reset counter without animations
    if (currentChatId !== chatIdRef.current) {
      chatIdRef.current = currentChatId;
      previousMessageCountRef.current = messages.length;
      setPreviousCount(messages.length);
      isInitialLoadRef.current = true; // Mark as initial load for new chat
      return;
    }

    // For same chat, check if this is the very first load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      previousMessageCountRef.current = messages.length;
      setPreviousCount(messages.length);
      return;
    }

    // Normal case: update counter for same chat after initial load
    setPreviousCount(previousMessageCountRef.current);
    previousMessageCountRef.current = messages.length;
  }, [messages]);

  return (
    <Box
      sx={{ flex: 1, overflow: 'auto', p: 2, overflowX: 'hidden' }}
      className='chat-messages'
    >
      {messages.map((message, index) => {
        const isOwnMessage = message.senderId === currentUserId;

        // Only animate the newest message(s) - not when switching chats or initial loads
        const isNewMessage = index >= previousCount;
        const shouldAnimate =
          isNewMessage &&
          !isInitialLoadRef.current &&
          messages[0]?.chatId === chatIdRef.current &&
          messages.length > previousCount; // Only if we actually have new messages

        const animationClass = shouldAnimate
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
