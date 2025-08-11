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
  selectedChatId?: string
) => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setChats([]);
        setIsLoading(false);
        return;
      }
      const userData = userSnap.data();
      const chatIds: string[] = Array.isArray(userData.chats)
        ? userData.chats
        : [];
      if (chatIds.length === 0) {
        setChats([]);
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
            ...loadedChats.filter((c) => c.chatId !== chatId),
            {
              chatId: chat.id,
              type: chat.type,
              name: chat.name,
              otherParticipants,
              lastMessage: undefined,
              unreadCount,
              updatedAt: chat.lastActivity
                ? new Date(chat.lastActivity)
                : new Date(chat.createdAt),
            },
          ];
          setChats([...loadedChats]);
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
    chats.forEach((chat) => {
      chat.otherParticipants.forEach((participant) => {
        if (!colors[participant.id]) {
          colors[participant.id] = generateAvatarColor(participant.id);
        }
      });
    });
    return colors;
  }, [chats]);

  const resetLocalUnreadCount = (chatId: string) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  return {
    chats,
    userColors,
    isLoading,
    error,
    resetLocalUnreadCount,
  };
};
