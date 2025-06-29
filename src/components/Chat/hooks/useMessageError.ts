import { useState } from 'react';

/**
 * Custom hook for managing message send error state
 */
export const useMessageError = () => {
  const [showError, setShowError] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string>('');
  const [onRetryCallback, setOnRetryCallback] = useState<(() => void) | null>(
    null
  );

  // Helper function to truncate message for display
  const truncateMessage = (message: string, maxLength: number = 30) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Handle error occurrence
  const handleError = (message: string, retryCallback?: () => void) => {
    setFailedMessage(message);
    setShowError(true);
    setOnRetryCallback(() => retryCallback || null);
  };

  // Handle error dismissal
  const handleClose = () => {
    setShowError(false);
    setFailedMessage('');
    setOnRetryCallback(null);
  };

  // Handle retry
  const handleRetry = () => {
    if (onRetryCallback) {
      onRetryCallback();
    }
    setShowError(false);
    setFailedMessage('');
    setOnRetryCallback(null);
  };

  return {
    showError,
    failedMessage,
    truncateMessage,
    handleError,
    handleClose,
    handleRetry,
  };
};
