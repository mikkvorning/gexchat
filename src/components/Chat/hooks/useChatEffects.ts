import { useEffect, useRef, useCallback } from 'react';
import { Message } from '../../../types/types';

/**
 * Shared hook for auto-scrolling to bottom when a new message is received.
 * Returns a ref to be attached to the scroll anchor and an imperative scroll function.
 *
 * @param messages - The array of messages to watch for changes
 * @param options - Optional scroll options (behavior: 'auto' | 'smooth')
 */
export const useScrollToBottomOnNewMessage = (
  messages: { length: number },
  options?: { behavior?: ScrollBehavior }
) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = options?.behavior || 'smooth') => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    },
    [options?.behavior]
  );
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages, scrollToBottom]);
  return { messagesEndRef, scrollToBottom };
};

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

  // Auto-scroll to bottom when a new message is received
  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  return {
    messagesEndRef,
  };
};
