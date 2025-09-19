import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { generateAvatarColor } from '../../../utils/colors';
import { Chat, ChatSummary, BaseUser } from '../../../types/types';

// Helper to fetch participant user data
const fetchParticipant = async (id: string): Promise<BaseUser | null> => {
  const participantRef = doc(db, 'users', id);
  const participantSnap = await getDoc(participantRef);
  if (!participantSnap.exists()) return null;
  const data = participantSnap.data();
  return {
    id: participantSnap.id,
    displayName: data.displayName || 'Unknown User',
    username:
      data.username || (data.displayName || 'unknown user').toLowerCase(),
    avatarUrl: data.avatarUrl,
    status: data.status || 'offline',
  };
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

  // ...existing code...

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
          const otherParticipantIds = chat.participants
            .map((p) => p.userId)
            .filter((id) => id !== userId);
          const otherParticipants = (
            await Promise.all(otherParticipantIds.map(fetchParticipant))
          ).filter((p): p is BaseUser => !!p);
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

  const resetLocalUnreadCount = (chatId: string) => {
    setChatSummaries((prevSummaries) =>
      prevSummaries.map((chat) =>
        chat.summaryId === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  if (isGeminiBot) {
    return {
      chatSummaries: [],
      userColors: {},
      isLoading: false,
      error: null,
      resetLocalUnreadCount: () => {},
    };
  }

  return {
    chatSummaries,
    userColors,
    isLoading,
    error,
    resetLocalUnreadCount,
  };
};
