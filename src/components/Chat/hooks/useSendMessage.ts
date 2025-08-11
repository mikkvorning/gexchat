import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendMessage } from '../../../lib/chatService';

interface UseSendMessageProps {
  chatId: string | null;
  userId: string | undefined;
  onError?: (message: string, retryCallback: () => void) => void;
}

/**
 * Custom hook for handling message sending functionality
 */
export const useSendMessage = ({
  chatId,
  userId,
  onError,
}: UseSendMessageProps) => {
  const [messageText, setMessageText] = useState('');
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string>('');
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Helper function for retry functionality
  // This function allows resending a failed message with its exact original content,
  // independent of what's currently in the input field. Used by the error ribbon
  // retry mechanism to resend failed messages without affecting user's current typing.
  const retrySendMessage = (content: string) => {
    if (!chatId || !userId) return;

    sendMessageMutation.mutate({
      chatId,
      senderId: userId,
      content,
    });
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({
      chatId,
      senderId,
      content,
    }: {
      chatId: string;
      senderId: string;
      content: string;
    }) => sendMessage(chatId, senderId, content),
    onSuccess: () => {
      // Message sent successfully, input was already cleared optimistically
      // No need to focus here, handled by useEffect
    },
    onError: (error, variables) => {
      console.error('Failed to send message:', error);
      // Store the failed message for potential retry
      setFailedMessage(variables.content);
      // Show error snackbar
      setShowErrorSnackbar(true);
      // Call external error handler if provided
      if (onError) {
        onError(variables.content, () => retrySendMessage(variables.content));
      }
      // No need to focus here, handled by useEffect
    },
  });

  // Handle sending message
  const handleSendMessage = () => {
    if (
      !chatId ||
      !userId ||
      !messageText.trim() ||
      sendMessageMutation.isPending
    ) {
      return;
    }

    const messageToSend = messageText.trim();

    // Optimistically clear the input immediately for better UX
    setMessageText('');

    sendMessageMutation.mutate({
      chatId,
      senderId: userId,
      content: messageToSend,
    });
    // No need to focus here, handled by useEffect
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
    if (failedMessage && chatId && userId) {
      sendMessageMutation.mutate({
        chatId,
        senderId: userId,
        content: failedMessage,
      });
      setShowErrorSnackbar(false);
      setFailedMessage('');
      // No need to focus here, handled by useEffect
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
