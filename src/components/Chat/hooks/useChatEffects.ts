import { useEffect, useRef, useCallback } from 'react';
import { Message } from '../../../types/types';

interface UseChatEffectsProps {
  selectedChat: string | null;
  messages: Message[];
  messageInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Custom hook for handling input focus and auto scroll UI effects
 */
export const useChatEffects = ({
  selectedChat,
  messages,
  messageInputRef,
}: UseChatEffectsProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessages = useRef<Message[]>([]);

  // Helper function to get chat switch information
  const getChatInfo = useCallback(() => {
    const prev = prevMessages.current;
    const currentChatId = messages[0]?.chatId;
    const prevChatId = prev[0]?.chatId;
    const isChatSwitch = currentChatId !== prevChatId;
    return { prev, currentChatId, prevChatId, isChatSwitch };
  }, [messages]);

  // Focus the message input when a chat is selected
  useEffect(() => {
    if (selectedChat && messageInputRef.current) {
      const timeoutId = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedChat, messageInputRef]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const { isChatSwitch } = getChatInfo();

    // Use instant scroll for chat switches, smooth for new messages
    const behavior: ScrollBehavior = isChatSwitch ? 'instant' : 'smooth';
    messagesEndRef.current?.scrollIntoView({ behavior });

    // Update reference for next comparison
    prevMessages.current = messages;
  }, [messages, getChatInfo]);

  /**
   * Determines if a message should animate based on its position and chat state
   */
  const shouldAnimate = useCallback(
    (messageIndex: number) => {
      const { prev, isChatSwitch } = getChatInfo();

      // Only animate messages that are new (beyond previous length) and not during chat switches
      return messageIndex >= prev.length && !isChatSwitch;
    },
    [getChatInfo]
  );

  return {
    messagesEndRef,
    shouldAnimate,
  };
};
