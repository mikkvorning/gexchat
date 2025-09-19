import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendMessage } from '../../../lib/chatService';

interface UseSendMessageProps {
  chatId: string | null;
  userId: string | undefined;
  onError?: (message: string, retryCallback: () => void) => void;
  geminiBotSendFn?: (content: string) => Promise<void>;
}

/**
 * Custom hook for handling message sending functionality
 */
export const useSendMessage = ({
  chatId,
  userId,
  onError,
  geminiBotSendFn,
}: UseSendMessageProps) => {
  const [messageText, setMessageText] = useState('');
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string>('');
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

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
    onError: (error, variables) => {
      console.error('Failed to send message:', error);
      setFailedMessage(variables.content);
      setShowErrorSnackbar(true);
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

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setShowErrorSnackbar(false);
    setFailedMessage('');
  };

  // Handle retry button click
  const handleRetry = () => {
    if (!failedMessage) return;
    if (geminiBotSendFn) {
      sendMessageMutation.mutate({
        chatId: '', // Not used for Gemini bot
        senderId: '', // Not used for Gemini bot
        content: failedMessage,
      });
      setShowErrorSnackbar(false);
      setFailedMessage('');
      return;
    }

    if (chatId && userId) {
      sendMessageMutation.mutate({
        chatId,
        senderId: userId,
        content: failedMessage,
      });
      setShowErrorSnackbar(false);
      setFailedMessage('');
    }
  };

  return {
    messageText,
    setMessageText,
    messageInputRef,
    sendMessageMutation,
    handleSendMessage,
    handleKeyPress,
    showErrorSnackbar,
    handleCloseSnackbar,
    failedMessage,
    handleRetry,
  };
};
