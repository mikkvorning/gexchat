import { useEffect, useRef } from 'react';
import { Message } from '../../../types/types';

interface UseChatEffectsProps {
  selectedChat: string | null;
  messages: Message[];
  messageInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Custom hook for handling chat UI effects like focus and auto-scroll
 */
export const useChatEffects = ({
  selectedChat,
  messages,
  messageInputRef,
}: UseChatEffectsProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus the message input when a chat is selected
  useEffect(() => {
    if (selectedChat && messageInputRef.current) {
      // Small delay to ensure the UI has rendered
      const timeoutId = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedChat, messageInputRef]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return {
    messagesEndRef,
  };
};
