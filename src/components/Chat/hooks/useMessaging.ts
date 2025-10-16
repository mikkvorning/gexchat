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

const TYPING_TIMEOUT_MS = 5000;
const GEMINI_BOT_ID = 'gemini-bot';

export const useMessaging = ({
  chatId,
  userId,
  onError,
  geminiBotSendFn,
  onMessageSent,
}: UseMessagingProps) => {
  const [messageText, setMessageText] = useState('');
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messageTextRef = useRef('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Update typing status on the backend
  const typingMutation = useMutation({
    mutationFn: ({ isTyping }: { isTyping: boolean }) =>
      updateTypingStatus(chatId!, userId!, isTyping),
    onSuccess: (_, variables) => (isTypingRef.current = variables.isTyping),
    onError: (error) => console.error('Failed to update typing status:', error),
  });

  // Clears any existing typing timeout
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

  // Checks if ids are valid in the context of indicating typing activity
  const hasValidId = () => chatId || userId || chatId !== GEMINI_BOT_ID;

  // Update the functions in the ref when dependencies change
  typingFunctionsRef.current.handleStartTyping = () => {
    if (!hasValidId()) return;
    clearTypingTimeout();

    // Only send typing true if not already typing
    if (!isTypingRef.current) typingMutation.mutate({ isTyping: true });

    // Set timeout to reset typing status after inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) typingMutation.mutate({ isTyping: false });
    }, TYPING_TIMEOUT_MS);
  };

  // Stop typing function
  typingFunctionsRef.current.handleStopTyping = () => {
    if (!hasValidId()) return;
    clearTypingTimeout();

    // Only send typing false if currently typing
    if (isTypingRef.current) typingMutation.mutate({ isTyping: false });
  };

  // Create stable callback references
  const handleStartTyping = useCallback(() => {
    typingFunctionsRef.current.handleStartTyping();
  }, []);

  const handleStopTyping = useCallback(() => {
    typingFunctionsRef.current.handleStopTyping();
  }, []);

  // Helper to check if we're in Gemini bot mode
  const isGeminiBot = !!geminiBotSendFn;

  // Helper to clear input text
  const clearInput = () => {
    setMessageText('');
    messageTextRef.current = '';
  };

  // Send message helper that handles both Gemini bot and regular chats
  const sendMutationMessage = (content: string) => {
    const mutationParams = isGeminiBot
      ? { chatId: '', senderId: '', content } // Empty values for Gemini bot
      : { chatId: chatId!, senderId: userId!, content };
    sendMessageMutation.mutate(mutationParams);
  };

  // Retry function to resend the last message
  const retrySendMessage = (content: string) => {
    if (isGeminiBot || (chatId && userId)) sendMutationMessage(content);
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
      typingFunctionsRef.current.handleStopTyping(); // Stop typing when message is sent
      onMessageSent?.(); // Call the callback when message is successfully sent
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
    const messageToSend = messageText.trim();
    clearInput(); // Clear optimistically for better UX

    // Validate requirements for regular chats (Gemini bot doesn't need validation)
    if (!isGeminiBot && (!chatId || !userId)) return;
    sendMutationMessage(messageToSend);
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
      if (!isGeminiBot) {
        const typingStateChanged = previousHasContent !== currentHasContent;
        const shouldResumeTyping = currentHasContent && !isTypingRef.current;

        if (typingStateChanged) {
          if (currentHasContent) handleStartTyping();
          else handleStopTyping();
        } else if (shouldResumeTyping) handleStartTyping(); // User is typing but typing status is false (likely due to timeout)
      }
    },
    [isGeminiBot, handleStartTyping, handleStopTyping]
  );

  return {
    messageText,
    messageInputRef,
    sendMessageMutation,
    handleSendMessage,
    handleKeyPress,
    handleTextChange,
    handleStopTyping,
  };
};
