import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendMessage, updateTypingStatus } from '../../../lib/chatService';

interface UseMessagingProps {
  chatId: string | null;
  userId: string | undefined;
  onError?: (message: string, retryCallback: () => void) => void;
  geminiBotSendFn?: (content: string) => Promise<void>;
  onMessageSent?: () => void; // Callback when message is successfully sent
}

/**
 * Custom hook for handling messaging functionality including sending messages and typing indicators
 */
export const useMessaging = ({
  chatId,
  userId,
  onError,
  geminiBotSendFn,
  onMessageSent,
}: UseMessagingProps) => {
  // Message state
  const [messageText, setMessageText] = useState('');
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messageTextRef = useRef('');

  // Typing state
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Typing status mutation
  const typingMutation = useMutation({
    mutationFn: ({ isTyping }: { isTyping: boolean }) =>
      updateTypingStatus(chatId!, userId!, isTyping),
    onSuccess: (_, variables) => {
      isTypingRef.current = variables.isTyping;
    },
    onError: (error) => {
      console.error('Failed to update typing status:', error);
    },
  });

  // Clear timeout helper
  const clearTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // Create stable typing functions using refs to avoid dependency issues
  const typingFunctionsRef = useRef({
    handleStartTyping: () => {},
    handleStopTyping: () => {},
  });

  // Update the functions in the ref when dependencies change
  typingFunctionsRef.current.handleStartTyping = () => {
    if (!chatId || !userId || chatId === 'gemini-bot') return;

    clearTypingTimeout();

    if (!isTypingRef.current) {
      typingMutation.mutate({ isTyping: true });
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        typingMutation.mutate({ isTyping: false });
      }
    }, 5000);
  };

  typingFunctionsRef.current.handleStopTyping = () => {
    if (!chatId || !userId || chatId === 'gemini-bot') return;

    clearTypingTimeout();

    if (isTypingRef.current) {
      typingMutation.mutate({ isTyping: false });
    }
  };

  // Create stable callback references
  const handleStartTyping = useCallback(() => {
    typingFunctionsRef.current.handleStartTyping();
  }, []);

  const handleStopTyping = useCallback(() => {
    typingFunctionsRef.current.handleStopTyping();
  }, []);

  /**
   * Helper function to retry sending a message. This function allows resending a failed message
   * with its exact original content, independent of what's currently in the input field.
   * Used by the error ribbon retry mechanism to resend failed messages without affecting
   * user's current typing.
   * @param content - The content of the message to resend.
   * @returns void
   */
  const retrySendMessage = (content: string) => {
    // For Gemini bot, we don't need chatId/userId validation
    if (geminiBotSendFn) {
      sendMessageMutation.mutate({
        chatId: '', // Not used for Gemini bot
        senderId: '', // Not used for Gemini bot
        content,
      });
      return;
    }

    if (!chatId || !userId) return;

    sendMessageMutation.mutate({
      chatId,
      senderId: userId,
      content,
    });
  };

  // Send message mutation as either Gemini bot or Firestore
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      chatId,
      senderId,
      content,
    }: {
      chatId: string;
      senderId: string;
      content: string;
    }) => {
      if (geminiBotSendFn) {
        await geminiBotSendFn(content);
        return; // No return value needed for Gemini bot
      }
      return sendMessage(chatId, senderId, content);
    },
    onSuccess: () => {
      // Stop typing when message is sent
      typingFunctionsRef.current.handleStopTyping();
      // Call the callback when message is successfully sent
      onMessageSent?.();
    },
    onError: (error, variables) => {
      console.error('Failed to send message:', error);
      // Call external error handler if provided, using our internal retry function
      onError?.(variables.content, () => retrySendMessage(variables.content));
    },
  });

  // Handle sending message
  const handleSendMessage = () => {
    if (!messageText.trim() || sendMessageMutation.isPending) return;

    // For Gemini bot, we don't need chatId/userId validation
    if (geminiBotSendFn) {
      const messageToSend = messageText.trim();
      setMessageText('');
      messageTextRef.current = ''; // Keep ref in sync
      sendMessageMutation.mutate({
        chatId: '', // Not used for Gemini bot
        senderId: '', // Not used for Gemini bot
        content: messageToSend,
      });
      return;
    }

    // Regular validation for Firestore messages
    if (!chatId || !userId) return;
    const messageToSend = messageText.trim();
    setMessageText(''); // Optimistically clear the input immediately for better UX
    messageTextRef.current = ''; // Keep ref in sync

    sendMessageMutation.mutate({
      chatId,
      senderId: userId,
      content: messageToSend,
    });
  };

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Handle text change with typing detection
  const handleTextChange = useCallback(
    (value: string) => {
      const previousHasContent = messageTextRef.current.trim().length > 0;
      const currentHasContent = value.trim().length > 0;

      // Update refs and state
      messageTextRef.current = value;
      setMessageText(value);

      // Only update backend when typing state actually changes (and not for Gemini bot)
      if (!geminiBotSendFn) {
        if (previousHasContent !== currentHasContent) {
          if (currentHasContent) {
            // User started typing (empty -> has content)
            handleStartTyping();
          } else {
            // User cleared the input (has content -> empty)
            handleStopTyping();
          }
        } else if (currentHasContent && !isTypingRef.current) {
          // User is typing but typing status is false (likely due to timeout)
          // Resume typing indicator
          handleStartTyping();
        }
      }
    },
    [geminiBotSendFn, handleStartTyping, handleStopTyping]
  );

  return {
    // Message functionality
    messageText,
    messageInputRef,
    sendMessageMutation,
    handleSendMessage,
    handleKeyPress,
    handleTextChange,

    // Typing functionality
    handleStopTyping,
  };
};
