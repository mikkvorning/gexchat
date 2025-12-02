import { generateGeminiText } from '@/lib/geminiService';
import { Chat, Message } from '@/types/types';
import { getErrorMessage } from '@/utils/errorMessages';
import { useEffect, useMemo, useState } from 'react';
import { useChatEffects } from '../../../Chat/hooks/useChatEffects';
import { GEMINI_BOT_CONFIG } from './geminiBotConfig';

const SESSION_KEY = `${GEMINI_BOT_CONFIG.id}-messages`;

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
    selectedChat: GEMINI_BOT_CONFIG.id,
    messages,
    messageInputRef: { current: null }, // ChatInput manages its own ref
  });

  // User participant is static since userId rarely changes (only on logout/login)
  const userParticipant = useMemo(
    () => ({
      userId: userId,
      displayName: 'You',
      unreadCount: 0,
      acceptStatus: 'ACCEPTED' as const,
      isTyping: false,
    }),
    [userId]
  );

  // Create a mock Chat object for the Gemini bot
  const geminiChat: Chat = useMemo(() => {
    const botParticipant = {
      userId: GEMINI_BOT_CONFIG.id,
      displayName: GEMINI_BOT_CONFIG.displayName,
      unreadCount: 0,
      acceptStatus: 'ACCEPTED' as const,
      isTyping: isGeminiTyping,
    };

    return {
      id: GEMINI_BOT_CONFIG.id,
      type: 'direct' as const,
      participants: [userParticipant, botParticipant],
      createdAt: new Date(0), // Use epoch time as constant since this is a mock chat
    };
  }, [userParticipant, isGeminiTyping]);

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
    chatId: GEMINI_BOT_CONFIG.id,
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
      const botMsg = createMessage(
        `${Date.now()}-bot`,
        GEMINI_BOT_CONFIG.id,
        reply
      );
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg = createMessage(
        `${Date.now()}-error`,
        GEMINI_BOT_CONFIG.id,
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
