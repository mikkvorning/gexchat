import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendMessage } from '../../../lib/chatService';

interface UseSendMessageProps {
  chatId: string | null;
  userId: string | undefined;
}

/**
 * Custom hook for handling message sending functionality
 */
export const useSendMessage = ({ chatId, userId }: UseSendMessageProps) => {
  const [messageText, setMessageText] = useState('');
  const messageInputRef = useRef<HTMLInputElement>(null);

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
      // Clear input - no need to invalidate queries since we use real-time listeners
      setMessageText('');
      // Refocus input
      messageInputRef.current?.focus();
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
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

    sendMessageMutation.mutate({
      chatId,
      senderId: userId,
      content: messageText.trim(),
    });
  };

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return {
    messageText,
    setMessageText,
    messageInputRef,
    sendMessageMutation,
    handleSendMessage,
    handleKeyPress,
  };
};
