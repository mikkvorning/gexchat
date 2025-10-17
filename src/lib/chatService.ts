import {
  BaseUser,
  Chat,
  ChatParticipant,
  ChatSummary,
  CreateChatRequest,
  CreateChatResponse,
  CurrentUser,
  Message,
} from '@/types/types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Helper function to convert Firestore Timestamp to Date
 */
const convertTimestamp = (timestamp: Date | Timestamp | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  return new Date();
};

/**
 * Create a new chat between users
 */
export const createChat = async (
  request: CreateChatRequest,
  currentUserId: string
): Promise<CreateChatResponse> => {
  if (!currentUserId) throw new Error('Current user ID is required');

  // Ensure current user is included in participants
  const allParticipantIds = [
    ...new Set([currentUserId, ...request.participantIds]),
  ];

  // For direct chats, ensure only 2 participants
  if (request.type === 'direct' && allParticipantIds.length !== 2) {
    throw new Error('Direct chats must have exactly 2 participants');
  }

  // Check if direct chat already exists
  if (request.type === 'direct') {
    const existingChat = await findExistingDirectChat(allParticipantIds);
    if (existingChat) {
      return { chatId: existingChat.id, chat: existingChat };
    }
  }

  // Fetch all user documents at once for display info and blocking status
  const userDocs = await Promise.all(
    allParticipantIds.map(async (userId) => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      return {
        userId,
        userRef,
        exists: userSnap.exists(),
        data: userSnap.exists() ? userSnap.data() : null,
      };
    })
  );

  // Create chat document with participant display info
  const chatRef = doc(collection(db, 'chats'));
  const chatId = chatRef.id;

  // Filter valid participants and create participant list
  const validParticipants: ChatParticipant[] = userDocs
    .filter(({ exists, data }) => exists && data)
    .map(({ userId, data }) => ({
      userId,
      displayName: data?.displayName || 'Unknown User',
      unreadCount: 0,
    }));

  const chatData: Chat = {
    id: chatId,
    type: request.type,
    ...(request.name && { name: request.name }),
    participants: validParticipants,
    createdAt: new Date(),
    lastActivity: new Date(),
  };

  // Use batch operations for better performance
  const batch = writeBatch(db);

  // Add chat document to batch
  batch.set(chatRef, {
    ...chatData,
    createdAt: serverTimestamp(),
  });

  // Commit all operations in a single batch
  await batch.commit();

  return { chatId, chat: chatData };
};

/**
 * Find existing direct chat between two users by matching participant IDs
 */
const findExistingDirectChat = async (
  participantIds: string[]
): Promise<Chat | null> => {
  const chatsRef = collection(db, 'chats');
  // Query for direct chats where first participant is present
  const q = query(
    chatsRef,
    where('type', '==', 'direct'),
    where('participants', 'array-contains', {
      userId: participantIds[0],
    })
  );

  const snapshot = await getDocs(q);

  // Check each chat to find one with exactly these participants
  for (const doc of snapshot.docs) {
    const chat = { id: doc.id, ...doc.data() } as Chat;

    // Ensure this is a direct chat with exactly 2 participants
    if (chat.type !== 'direct' || chat.participants.length !== 2) continue;

    // Compare participant IDs only
    const chatUserIds = chat.participants.map((p) => p.userId).sort();
    const requestUserIds = [...participantIds].sort();

    if (
      chatUserIds.length === requestUserIds.length &&
      chatUserIds.every((id, index) => id === requestUserIds[index])
    )
      return chat;
  }
  return null;
};

/**
 * Get all chats for a user
 */
export const getUserChats = async (userId: string): Promise<ChatSummary[]> => {
  if (!userId) return [];

  // Get user document to get their chat IDs
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return [];

  const userData = userSnap.data();
  const chatIds: string[] = userData.chats || [];

  if (chatIds.length === 0) return [];

  // Get all chat documents in parallel
  const chatDocs = await Promise.all(
    chatIds.map(async (chatId) => {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      return { chatId, chatSnap };
    })
  );

  // Collect all unique participant IDs
  const allParticipantIds = new Set<string>();
  const validChats: { chatId: string; chat: Chat }[] = [];

  chatDocs.forEach(({ chatId, chatSnap }) => {
    if (chatSnap.exists()) {
      const chat = { id: chatSnap.id, ...chatSnap.data() } as Chat;
      validChats.push({ chatId, chat });

      // Collect participant IDs (excluding current user)
      chat.participants
        .map((p) => p.userId)
        .filter((id) => id !== userId)
        .forEach((id) => allParticipantIds.add(id));
    }
  });

  // Fetch all participant data in parallel
  const participantData = new Map<string, BaseUser>();
  if (allParticipantIds.size > 0) {
    const participantDocs = await Promise.all(
      Array.from(allParticipantIds).map(async (participantId) => {
        const participantRef = doc(db, 'users', participantId);
        const participantSnap = await getDoc(participantRef);
        return { participantId, participantSnap };
      })
    );

    participantDocs.forEach(({ participantId, participantSnap }) => {
      if (participantSnap.exists()) {
        const data = participantSnap.data();
        participantData.set(participantId, {
          id: participantSnap.id,
          displayName: data.displayName || 'Unknown User',
          username:
            data.username || (data.displayName || 'unknown user').toLowerCase(),
          avatarUrl: data.avatarUrl,
          status: data.status || 'offline',
        });
      }
    });
  }

  // Get last messages for all chats in parallel
  const chatSummaries = await Promise.all(
    validChats.map(async ({ chatId, chat }) => {
      // Get other participants
      const otherParticipantIds = chat.participants
        .map((p) => p.userId)
        .filter((id) => id !== userId);

      const otherParticipants: BaseUser[] = otherParticipantIds
        .map((id) => participantData.get(id))
        .filter((participant): participant is BaseUser => !!participant);

      // Get last message
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const lastMessageQuery = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const lastMessageSnap = await getDocs(lastMessageQuery);

      let lastMessage: Message | undefined;
      if (!lastMessageSnap.empty) {
        const lastMessageDoc = lastMessageSnap.docs[0];
        const messageData = lastMessageDoc.data();
        lastMessage = {
          id: lastMessageDoc.id,
          chatId: chatId,
          senderId: messageData.senderId,
          content: messageData.content,
          timestamp: convertTimestamp(
            messageData.timestamp as Date | Timestamp
          ),
          edited: messageData.edited || false,
          replyTo: messageData.replyTo,
          attachments: messageData.attachments,
        };
      }

      return {
        summaryId: chat.id,
        type: chat.type,
        name: chat.name,
        otherParticipants,
        lastMessage,
        unreadCount:
          chat.participants.find((p) => p.userId === userId)?.unreadCount || 0,
        updatedAt:
          lastMessage?.timestamp ||
          convertTimestamp(chat.createdAt as Date | Timestamp),
      } as ChatSummary;
    })
  );

  // Sort by last activity
  return chatSummaries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

/**
 * Get a specific chat by ID
 */
export const getChat = async (chatId: string): Promise<Chat | null> => {
  if (!chatId) return null;

  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) return null;

  const data = chatSnap.data();
  const chat = { id: chatSnap.id, ...data } as Chat;

  // Convert timestamps
  chat.createdAt = convertTimestamp(data.createdAt as Date | Timestamp);

  return chat;
};

/**
 * Get messages for a specific chat
 */
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  if (!chatId) return [];

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: convertTimestamp(data.timestamp as Date | Timestamp),
    };
  }) as Message[];
};

/**
 * Send a message to a chat
 *
 * If the sender is actively viewing the chat, do not increment their unread count.
 * Optionally pass activeUserId and activeChatId to prevent incrementing unread count for the active user.
 */
export const sendMessage = async (
  chatId: string,
  senderId: string,
  content: string,
  activeUserId?: string,
  activeChatId?: string
): Promise<Message> => {
  if (!chatId || !senderId || !content.trim()) {
    throw new Error('Chat ID, sender ID, and content are required');
  }

  const batch = writeBatch(db);
  const chatRef = doc(db, 'chats', chatId);
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const newMessageRef = doc(messagesRef);

  // Get chat to update unread count for other participants
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) throw new Error('Chat not found');

  const chat = chatSnap.data() as Chat;

  // Check if this is the first message in the chat
  const messagesQuery = query(messagesRef, limit(1));
  const messagesSnap = await getDocs(messagesQuery);
  const isFirstMessage = messagesSnap.empty;

  // Create message document
  const messageData = {
    id: newMessageRef.id,
    chatId,
    senderId,
    content: content.trim(),
    timestamp: serverTimestamp(),
    edited: false,
  };

  // Add message to batch
  batch.set(newMessageRef, messageData);

  // Update chat with lastActivity and lastMessage at root level, increment unread count for other participants
  const updatedParticipants = chat.participants.map((p) => {
    if (p.userId === senderId) return { ...p, unreadCount: 0 };
    // If user is actively viewing this chat, do not increment their unread count
    if (activeUserId && activeChatId === chatId && p.userId === activeUserId) {
      return p;
    }
    return { ...p, unreadCount: p.unreadCount + 1 };
  });

  batch.update(chatRef, {
    lastActivity: serverTimestamp(),
    lastMessage: messageData,
    participants: updatedParticipants,
  });

  // If this is the first message, add chatId to all participants' user docs
  if (isFirstMessage) {
    for (const participant of chat.participants) {
      const userRef = doc(db, 'users', participant.userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      batch.set(
        userRef,
        {
          id: participant.userId,
          chats: Array.isArray(userData.chats)
            ? Array.from(new Set([...userData.chats, chatId]))
            : [chatId],
          createdAt: userData.createdAt || new Date(),
        },
        { merge: true }
      );
    }
  }

  // Commit all changes in one batch
  await batch.commit();

  return {
    ...messageData,
    timestamp: new Date(), // Return current date for immediate UI update
  } as Message;
};

/**
 * Initialize user document with default structure if it doesn't exist
 */
export const initializeUserDocument = async (
  userId: string,
  userData: Partial<CurrentUser> = {}
) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const defaultUserData = {
      chats: [],
      blocked: [],
      friends: {
        list: [],
        pending: [],
      },
      privacy: {
        showStatus: true,
        showLastSeen: true,
        showActivity: true,
      },
      notifications: {
        enabled: true,
        sound: true,
        muteUntil: null,
      },
      createdAt: serverTimestamp(),
      ...userData,
    };

    await setDoc(userRef, defaultUserData);
    return defaultUserData;
  }

  return userSnap.data();
};

/**
 * Subscribe to real-time messages for a specific chat
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  if (!chatId) throw new Error('Chat ID is required');
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: convertTimestamp(data.timestamp as Date | Timestamp),
        };
      }) as Message[];
      callback(messages);
    },
    (error) => console.error('Error in messages subscription:', error)
  );
};

// Subscribe to real-time chat data
export const subscribeToChat = (
  chatId: string,
  callback: (chat: Chat | null) => void
): Unsubscribe => {
  if (!chatId) throw new Error('Chat ID is required');
  const chatRef = doc(db, 'chats', chatId);

  return onSnapshot(
    chatRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const chat = {
          id: doc.id,
          ...data,
          type: data.type,
          participants: data.participants,
          createdAt: convertTimestamp(data.createdAt as Date | Timestamp),
          lastActivity: data.lastActivity
            ? convertTimestamp(data.lastActivity as Date | Timestamp)
            : undefined,
        } as Chat;
        callback(chat);
      } else callback(null);
    },
    (error) => console.error('Error in chat subscription:', error)
  );
};

// Reset unread count for a user in one or more chats
export const resetUnreadCount = async (
  chatIds: (string | null)[],
  userId: string
) => {
  await Promise.all(
    // prettier-ignore
    (chatIds
      .filter(Boolean)
      .filter((id) => id !== 'gemini-bot') as string[]).map(async (chatId) => {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) return;

      const chat = chatSnap.data() as Chat;
      const updatedParticipants = chat.participants.map((p) =>
        p.userId === userId ? { ...p, unreadCount: 0 } : p
      );
      await updateDoc(chatRef, { participants: updatedParticipants });
    })
  );
};

/**
 * Update typing status for a user in a chat
 */
export const updateTypingStatus = async (
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  if (!chatId || !userId || chatId === 'gemini-bot') return;

  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) return;

  const chat = chatSnap.data() as Chat;
  const updatedParticipants = chat.participants.map((p) =>
    p.userId === userId ? { ...p, isTyping } : p
  );
  await updateDoc(chatRef, { participants: updatedParticipants });
};
