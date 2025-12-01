import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { db } from '../../../lib/firebase';
import { BaseUser, Chat, ChatSummary } from '../../../types/types';
import { generateAvatarColor } from '../../../utils/colors';

// Helper function to extract other participants in a chat
const getOtherParticipants = (
  chat: Chat,
  currentUserId: string
): BaseUser[] => {
  return chat.participants
    .filter((p) => p.userId !== currentUserId)
    .map((p) => ({
      id: p.userId,
      displayName: p.displayName || 'Unknown User',
      username: (p.displayName || 'unknown user')
        .toLowerCase()
        .replace(/\s+/g, ''),
      avatarUrl: undefined, // Not stored in chat participants - could be fetched separately if needed
      status: 'offline', // Not stored in chat participants - could be fetched separately if needed
    }));
};

/**
 * Real-time hook for ChatList data using Firestore listeners
 */
export const useChatList = (
  userId: string | undefined,
  selectedChatId?: string,
  isGeminiBot?: boolean
) => {
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Reduce and document this useEffect
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    const userRef = doc(db, 'users', userId);
    let chatUnsubscribers: (() => void)[] = [];

    const unsubscribeUser = onSnapshot(userRef, (userSnap) => {
      if (!userSnap.exists()) {
        setChatSummaries([]);
        setIsLoading(false);
        return;
      }
      const userData = userSnap.data();
      const chatIds: string[] = Array.isArray(userData.chats)
        ? userData.chats
        : [];
      if (chatIds.length === 0) {
        setChatSummaries([]);
        setIsLoading(false);
        chatUnsubscribers.forEach((unsub) => unsub());
        chatUnsubscribers = [];
        return;
      }

      chatUnsubscribers.forEach((unsub) => unsub());
      chatUnsubscribers = [];
      let loadedChats: ChatSummary[] = [];

      chatIds.forEach((chatId) => {
        const chatRef = doc(db, 'chats', chatId);
        const unsubscribe = onSnapshot(chatRef, async (chatSnap) => {
          if (!chatSnap.exists()) {
            setIsLoading(false);
            return;
          }
          const chat = { id: chatSnap.id, ...chatSnap.data() } as Chat;
          const otherParticipants = getOtherParticipants(chat, userId!);
          let unreadCount =
            chat.participants.find((p) => p.userId === userId)?.unreadCount ||
            0;
          if (selectedChatId && selectedChatId === chatId) unreadCount = 0;
          loadedChats = [
            ...loadedChats.filter((c) => c.summaryId !== chatId),
            {
              summaryId: chat.id,
              type: chat.type,
              name: chat.name,
              otherParticipants,
              lastMessage: chat.lastMessage, // <-- now from root level
              unreadCount,
              updatedAt: chat.lastActivity
                ? new Date(chat.lastActivity)
                : new Date(chat.createdAt),
            },
          ];
          setChatSummaries([...loadedChats]);
          setIsLoading(false);
        });
        chatUnsubscribers.push(unsubscribe);
      });
    });

    return () => {
      chatUnsubscribers.forEach((unsub) => unsub());
      unsubscribeUser();
    };
  }, [userId, selectedChatId]);

  // Memorize user colors generated from user IDs
  const userColors = useMemo(() => {
    const colors: Record<string, string> = {};
    chatSummaries.forEach((summary) => {
      summary.otherParticipants.forEach((participant) => {
        if (!colors[participant.id]) {
          colors[participant.id] = generateAvatarColor(participant.id);
        }
      });
    });
    return colors;
  }, [chatSummaries]);

  if (isGeminiBot) {
    return {
      chatSummaries: [],
      userColors: {},
      isLoading: false,
      error: null,
    };
  }

  return {
    chatSummaries,
    userColors,
    isLoading,
    error,
  };
};
