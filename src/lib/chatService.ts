import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  arrayUnion,
  serverTimestamp,
  writeBatch,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Chat,
  CreateChatRequest,
  CreateChatResponse,
  ChatSummary,
  BaseUser,
  CurrentUser,
  Message,
} from '@/types/types';

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

  // Create new chat document
  const chatRef = doc(collection(db, 'chats'));
  const chatId = chatRef.id;
  const chatData: Chat = {
    id: chatId,
    type: request.type,
    ...(request.name && { name: request.name }),
    participants: allParticipantIds.map((userId) => ({
      userId,
      role: (userId === currentUserId ? 'admin' : 'member') as
        | 'admin'
        | 'member',
      joinedAt: new Date(),
    })),
    createdAt: new Date(),
    unreadCount: 0,
  };

  // Use batch operations for better performance
  const batch = writeBatch(db);

  // Add chat document to batch
  batch.set(chatRef, {
    ...chatData,
    createdAt: serverTimestamp(),
  });

  // Fetch all user documents at once to check blocking status
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

  // Check for blocking relationships and update user chats in batch
  for (const user of userDocs) {
    const { userId, userRef, exists, data } = user;

    // Check if this user has blocked any other participants
    const otherParticipantIds = allParticipantIds.filter((id) => id !== userId);
    const blockedUsers = data?.blocked || [];
    const hasBlockedParticipant = otherParticipantIds.some((id) =>
      blockedUsers.includes(id)
    );

    // Check if any other participant has blocked this user
    const isBlockedByOthers = userDocs
      .filter((u) => u.userId !== userId && u.data)
      .some((u) => (u.data?.blocked || []).includes(userId));

    // Only add chat to user's list if there's no blocking involved
    if (!hasBlockedParticipant && !isBlockedByOthers) {
      if (exists && data) {
        // Update existing user document
        const currentChats = Array.isArray(data.chats) ? data.chats : [];
        batch.update(userRef, {
          chats: [...currentChats, chatId],
        });
      } else {
        // Create new user document
        batch.set(
          userRef,
          {
            id: userId,
            chats: [chatId],
            createdAt: new Date(),
          },
          { merge: true }
        );
      }
    }
  }

  // Commit all operations in a single batch
  await batch.commit();

  return { chatId, chat: chatData };
};

/**
 * Find existing direct chat between two users
 */
const findExistingDirectChat = async (
  participantIds: string[]
): Promise<Chat | null> => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('type', '==', 'direct'),
    where('participants', 'array-contains', { userId: participantIds[0] })
  );

  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    const chat = { id: doc.id, ...doc.data() } as Chat;
    const chatUserIds = chat.participants.map((p) => p.userId).sort();
    const requestUserIds = participantIds.sort();

    if (JSON.stringify(chatUserIds) === JSON.stringify(requestUserIds)) {
      return chat;
    }
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
        chatId: chat.id,
        type: chat.type,
        name: chat.name,
        otherParticipants,
        lastMessage,
        unreadCount: chat.unreadCount || 0,
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
 */
export const sendMessage = async (
  chatId: string,
  senderId: string,
  content: string
): Promise<Message> => {
  if (!chatId || !senderId || !content.trim()) {
    throw new Error('Chat ID, sender ID, and content are required');
  }

  // Create new message document
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const newMessageRef = doc(messagesRef);

  const messageData = {
    id: newMessageRef.id,
    chatId,
    senderId,
    content: content.trim(),
    timestamp: serverTimestamp(),
    edited: false,
  };

  await setDoc(newMessageRef, messageData);

  // Update chat's lastActivity (no more lastMessage duplication)
  const chatRef = doc(db, 'chats', chatId);
  await setDoc(
    chatRef,
    {
      lastActivity: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    ...messageData,
    timestamp: new Date(), // Return current date for immediate UI update
  } as Message;
};

/**
 * Add a contact/friend (separate from starting a chat)
 */
export const addFriend = async (
  userId: string,
  friendId: string
): Promise<void> => {
  if (!userId || !friendId) throw new Error('Missing user or friend ID');
  if (userId === friendId) throw new Error('Cannot add yourself as a friend');

  const batch = writeBatch(db);

  // Add friend to current user's friends list
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    'friends.list': arrayUnion(friendId),
  });

  // Add current user to friend's friends list
  const friendRef = doc(db, 'users', friendId);
  batch.update(friendRef, {
    'friends.list': arrayUnion(userId),
  });

  await batch.commit();
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
  if (!chatId) {
    throw new Error('Chat ID is required');
  }

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
    (error) => {
      console.error('Error in messages subscription:', error);
    }
  );
};

/**
 * Subscribe to real-time chat data
 */
export const subscribeToChat = (
  chatId: string,
  callback: (chat: Chat | null) => void
): Unsubscribe => {
  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  const chatRef = doc(db, 'chats', chatId);

  return onSnapshot(
    chatRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const chat = { id: doc.id, ...data } as Chat;
        chat.createdAt = convertTimestamp(data.createdAt as Date | Timestamp);
        callback(chat);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error in chat subscription:', error);
    }
  );
};
