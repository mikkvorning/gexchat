import { generateGeminiText } from '@/lib/geminiService';
import { Chat, Message } from '@/types/types';
import { getErrorMessage } from '@/utils/errorMessages';
import { useEffect, useMemo, useState } from 'react';
import { useChatEffects } from '../../../Chat/hooks/useChatEffects';

const SESSION_KEY = 'gemini-bot-messages';
const GEMINI_BOT_ID = 'gemini-bot';

export const useGeminiBotChat = (userId: string) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGeminiTyping, setIsGeminiTyping] = useState(false);

  const { messagesEndRef } = useChatEffects({
    selectedChat: GEMINI_BOT_ID,
    messages,
    messageInputRef: { current: null }, // ChatInput manages its own ref
  });

  // Create a mock Chat object for the Gemini bot
  const geminiChat: Chat = useMemo(
    () => ({
      id: GEMINI_BOT_ID,
      type: 'direct' as const,
      participants: [
        {
          userId: userId,
          displayName: 'You',
          unreadCount: 0,
          isTyping: false,
        },
        {
          userId: GEMINI_BOT_ID,
          displayName: 'Gemini',
          unreadCount: 0,
          isTyping: isGeminiTyping,
        },
      ],
      createdAt: new Date(),
    }),
    [userId, isGeminiTyping]
  );

  // Persist messages in sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  }, [messages]);

  // Helper to create message objects
  const createMessage = (
    id: string,
    senderId: string,
    content: string
  ): Message => ({
    id,
    chatId: GEMINI_BOT_ID,
    senderId,
    content,
    timestamp: new Date(),
  });

  const sendMessage = async (content: string) => {
    const userMsg = createMessage(`${Date.now()}-user`, userId, content);
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setIsGeminiTyping(true);

    try {
      const reply = await generateGeminiText(content);
      const botMsg = createMessage(`${Date.now()}-bot`, GEMINI_BOT_ID, reply);
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg = createMessage(
        `${Date.now()}-error`,
        GEMINI_BOT_ID,
        getErrorMessage(error)
      );
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      // Stop typing indicator
      setIsGeminiTyping(false);
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    messagesEndRef,
    chat: geminiChat, // Provide the mock chat object
  };
};
