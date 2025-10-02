import { useState, useEffect } from 'react';
import { useChatEffects } from '../../../Chat/hooks/useChatEffects';
import { Message } from '@/types/types';
import { generateGeminiText } from '@/lib/geminiService';
import { getErrorMessage } from '@/utils/errorMessages';

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
  const { messagesEndRef } = useChatEffects({
    selectedChat: GEMINI_BOT_ID,
    messages,
    messageInputRef: { current: null }, // ChatInput manages its own ref
  });

  // Persist messages in sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async (content: string) => {
    const userMsg: Message = {
      id: `${Date.now()}-user`,
      chatId: GEMINI_BOT_ID,
      senderId: userId,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const reply = await generateGeminiText(content);
      const botMsg: Message = {
        id: `${Date.now()}-bot`,
        chatId: GEMINI_BOT_ID,
        senderId: GEMINI_BOT_ID,
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: `${Date.now()}-error`,
        chatId: GEMINI_BOT_ID,
        senderId: GEMINI_BOT_ID,
        content: getErrorMessage(error),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    messagesEndRef,
  };
};
