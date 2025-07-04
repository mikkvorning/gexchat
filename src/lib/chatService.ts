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
 * Get unread count for a user using tiered counting (returns numbers only)
 * Uses optimal approach - only checks specific breakpoint positions
 * Respects privacy settings - returns 0 if user has disabled read receipts
 */
const getUnreadCountForUser = async (
  chat: Chat,
  userId: string,
  chatId: string
): Promise<number> => {
  const participant = chat.participants.find((p) => p.userId === userId);
  if (!participant) return 0;

  // Check user's privacy settings first
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    // If user has disabled showing read receipts, don't calculate unread counts
    if (userData?.privacy?.showReadReceipts === false) {
      return 0;
    }
  }

  // If we have a cached unread count, use it (most efficient)
  if (typeof participant.unreadCount === 'number') {
    return participant.unreadCount;
  }

  // Calculate tiered unread count
  return await calculateTieredUnreadCount(chat, userId, chatId);
};

/**
 * Calculate unread count using tiered system - truly optimal approach
 * Checks specific positions (26th, 51st, 76th, 101st) to determine tier
 */
const calculateTieredUnreadCount = async (
  chat: Chat,
  userId: string,
  chatId: string
): Promise<number> => {
  try {
    const participant = chat.participants.find((p) => p.userId === userId);
    if (!participant) return 0;

    const messagesRef = collection(db, 'chats', chatId, 'messages');

    // Build base query for unread messages - avoid composite index
    let baseQuery = query(messagesRef, orderBy('timestamp', 'desc'));

    if (participant.lastReadMessageId) {
      // Get the last read message to find its timestamp
      const lastReadMessageRef = doc(
        messagesRef,
        participant.lastReadMessageId
      );
      const lastReadMessageSnap = await getDoc(lastReadMessageRef);

      if (lastReadMessageSnap.exists()) {
        const lastReadTimestamp = lastReadMessageSnap.data().timestamp;
        baseQuery = query(
          messagesRef,
          where('timestamp', '>', lastReadTimestamp),
          orderBy('timestamp', 'desc')
        );
      }
    }

    const increment = 25; // Messages per tier
    const numberOfIncrements = 4; // Total tiers to check

    // First, check if we have 0-25 messages (exact count)
    const firstCheckQuery = query(baseQuery, limit(increment + 1));
    const firstCheckSnap = await getDocs(firstCheckQuery);

    // Filter out user's own messages
    const filteredFirstCheck = firstCheckSnap.docs.filter(
      (doc) => doc.data().senderId !== userId
    );

    if (filteredFirstCheck.length <= increment) {
      // 25 or fewer unread messages, return exact count
      return filteredFirstCheck.length;
    }

    // We have 26+ messages, check each tier breakpoint using loop
    for (let i = 1; i < numberOfIncrements; i++) {
      const checkPosition = (i + 1) * increment + 1; // 51, 76, 101
      const checkQuery = query(baseQuery, limit(checkPosition));
      const checkSnap = await getDocs(checkQuery);

      // Filter out user's own messages
      const filteredMessages = checkSnap.docs.filter(
        (doc) => doc.data().senderId !== userId
      );

      // If we have fewer messages than this position, return previous tier base count
      if (filteredMessages.length < checkPosition) {
        return i * increment; // Returns 25, 50, or 75 (base count for tier)
      }
    }

    // If we reach here, we have 100+ unread messages
    return numberOfIncrements * increment; // Returns 100
  } catch (error) {
    console.error('Error in calculateTieredUnreadCount:', error);
    return 0; // Return 0 on error to prevent chat list from breaking
  }
};

/**
 * Helper function to increment unread count (numbers only)
 */
const incrementUnreadCount = (currentCount: number | undefined): number => {
  if (currentCount === undefined || currentCount === 0) return 1;
  return currentCount + 1;
};

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
      lastReadMessageId: undefined,
      lastReadTimestamp: undefined,
      unreadCount: 0, // Initialize with 0 unread messages
    })),
    createdAt: new Date(),
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
          readBy: messageData.readBy || [],
        };
      }

      // Use cached unread count if available, otherwise calculate efficiently
      const unreadCount = await getUnreadCountForUser(chat, userId, chatId);

      return {
        chatId: chat.id,
        type: chat.type,
        name: chat.name,
        otherParticipants,
        lastMessage,
        unreadCount,
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
      readBy: data.readBy || [],
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
    readBy: [], // Initialize empty read receipts
  };

  // Use batch to update both message and chat counters
  const batch = writeBatch(db);

  // Add the message
  batch.set(newMessageRef, messageData);

  // Update chat's lastActivity and increment unread counts for other participants
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    const chat = { id: chatSnap.id, ...chatSnap.data() } as Chat;

    // Update unread counts for all participants except the sender
    const updatedParticipants = chat.participants.map((participant) => {
      if (participant.userId !== senderId) {
        const currentCount =
          typeof participant.unreadCount === 'number'
            ? participant.unreadCount
            : 0;
        return {
          ...participant,
          unreadCount: incrementUnreadCount(currentCount),
        };
      }
      return participant;
    });

    batch.update(chatRef, {
      participants: updatedParticipants,
      lastActivity: serverTimestamp(),
    });
  }

  await batch.commit();

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
        showReadReceipts: true,
        allowReadReceipts: true,
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
 * Mark messages as read for a specific user in a chat
 */
export const markMessagesAsRead = async (
  chatId: string,
  userId: string,
  lastReadMessageId?: string
): Promise<void> => {
  if (!chatId || !userId) {
    throw new Error('Chat ID and user ID are required');
  }

  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    throw new Error('Chat not found');
  }

  const chat = { id: chatSnap.id, ...chatSnap.data() } as Chat;
  const participantIndex = chat.participants.findIndex(
    (p) => p.userId === userId
  );

  if (participantIndex === -1) {
    throw new Error('User is not a participant in this chat');
  }

  // If no specific message ID provided, get the latest message
  let messageIdToMark = lastReadMessageId;
  if (!messageIdToMark) {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const lastMessageQuery = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const lastMessageSnap = await getDocs(lastMessageQuery);

    if (!lastMessageSnap.empty) {
      messageIdToMark = lastMessageSnap.docs[0].id;
    }
  }

  if (messageIdToMark) {
    // Update the participant's last read message and reset unread count
    const updatedParticipants = [...chat.participants];
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      lastReadMessageId: messageIdToMark,
      lastReadTimestamp: new Date(),
      unreadCount: 0, // Reset unread count when marking as read
    };

    await setDoc(
      chatRef,
      {
        participants: updatedParticipants,
      },
      { merge: true }
    );
  }
};

/**
 * Get read receipt information for a message (respects privacy settings)
 */
export const getMessageReadReceipts = async (
  chatId: string,
  messageId: string,
  requestingUserId: string
): Promise<{ userId: string; readAt: Date; displayName: string }[]> => {
  if (!chatId || !messageId || !requestingUserId) {
    throw new Error('Chat ID, message ID, and requesting user ID are required');
  }

  // Get the message
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  const messageSnap = await getDoc(messageRef);

  if (!messageSnap.exists()) {
    return [];
  }

  const message = messageSnap.data() as Message;

  // Only show read receipts if the requesting user is the sender
  if (message.senderId !== requestingUserId) {
    return [];
  }

  const readBy = message.readBy || [];
  if (readBy.length === 0) {
    return [];
  }

  // Get user privacy settings and display names
  const userIds = readBy.map((r) => r.userId);
  const userDocs = await Promise.all(
    userIds.map(async (userId) => {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      return { userId, data: userSnap.exists() ? userSnap.data() : null };
    })
  );

  const result: { userId: string; readAt: Date; displayName: string }[] = [];

  for (const readInfo of readBy) {
    const userData = userDocs.find((u) => u.userId === readInfo.userId)?.data;

    // Check if user allows showing read receipts
    if (userData?.privacy?.showReadReceipts !== false) {
      result.push({
        userId: readInfo.userId,
        readAt: readInfo.readAt,
        displayName: userData?.displayName || 'Unknown User',
      });
    }
  }

  return result;
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
          readBy: data.readBy || [],
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
