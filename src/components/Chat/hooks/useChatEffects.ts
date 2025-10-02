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
  const prevMessages = useRef<Message[]>([]);
  console.log('prevMessages', prevMessages);

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
    const prev = prevMessages.current;
    const currentChatId = messages[0]?.chatId;
    const prevChatId = prev[0]?.chatId;

    if (messages.length > prev.length) {
      const isChatSwitch = currentChatId !== prevChatId;
      const behavior: ScrollBehavior = isChatSwitch ? 'auto' : 'smooth';
      messagesEndRef.current?.scrollIntoView({ behavior });
    }

    prevMessages.current = messages;
  }, [messages]);

  return {
    messagesEndRef,
    shouldAnimate: (messageIndex: number) => {
      const prev = prevMessages.current;
      const isChatSwitch = messages[0]?.chatId !== prev[0]?.chatId;
      return messageIndex >= prev.length && !isChatSwitch;
    },
  };
};
