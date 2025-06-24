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
  Timestamp,
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
    ...(request.name && { name: request.name }), // Only include name if it's defined
    participants: allParticipantIds.map((userId) => ({
      userId,
      username: '',
      role: userId === currentUserId ? 'admin' : 'member',
      joinedAt: new Date(),
    })),
    createdAt: new Date(),
    unreadCount: 0,
  };

  // Create chat document first
  await setDoc(chatRef, {
    ...chatData,
    createdAt: serverTimestamp(),
    participants: chatData.participants.map((p) => ({
      ...p,
      joinedAt: new Date(),
    })),
  });

  // Add chat ID to each participant's chats array (unless blocked)
  for (const userId of allParticipantIds) {
    const userRef = doc(db, 'users', userId);

    try {
      // Check if user document exists and has chats field
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Check if this user has blocked any of the other participants
        const otherParticipantIds = allParticipantIds.filter(
          (id) => id !== userId
        );
        const blockedUsers = userData.blocked || [];
        const hasBlockedParticipant = otherParticipantIds.some((id) =>
          blockedUsers.includes(id)
        );

        // Check if any other participant has blocked this user
        let isBlockedByOthers = false;
        for (const otherUserId of otherParticipantIds) {
          const otherUserRef = doc(db, 'users', otherUserId);
          const otherUserSnap = await getDoc(otherUserRef);
          if (otherUserSnap.exists()) {
            const otherUserData = otherUserSnap.data();
            const otherBlockedUsers = otherUserData.blocked || [];
            if (otherBlockedUsers.includes(userId)) {
              isBlockedByOthers = true;
              break;
            }
          }
        }

        // Only add chat to user's list if there's no blocking involved
        if (!hasBlockedParticipant && !isBlockedByOthers) {
          const newUserData = {
            ...userData,
            chats:
              userData.chats && Array.isArray(userData.chats)
                ? [...userData.chats, chatId]
                : [chatId],
          };

          await setDoc(userRef, newUserData);
        }
      } else {
        // For new users, we still create the document but only if not blocked
        // Since this is a new user, we assume they haven't blocked anyone yet
        let isBlockedByOthers = false;
        const otherParticipantIds = allParticipantIds.filter(
          (id) => id !== userId
        );

        for (const otherUserId of otherParticipantIds) {
          const otherUserRef = doc(db, 'users', otherUserId);
          const otherUserSnap = await getDoc(otherUserRef);
          if (otherUserSnap.exists()) {
            const otherUserData = otherUserSnap.data();
            const otherBlockedUsers = otherUserData.blocked || [];
            if (otherBlockedUsers.includes(userId)) {
              isBlockedByOthers = true;
              break;
            }
          }
        }

        if (!isBlockedByOthers) {
          const newUserData = {
            chats: [chatId],
            createdAt: new Date(),
            id: userId,
          };

          // User document doesn't exist, create it with chats field
          await setDoc(userRef, newUserData, { merge: true });
        }
      }
    } catch (error) {
      console.error('Error updating user chats:', error);
      // Continue with other users even if one fails
    }
  }

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

  // Get all chat documents
  const chatSummaries: ChatSummary[] = [];

  for (const chatId of chatIds) {
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const chat = { id: chatSnap.id, ...chatSnap.data() } as Chat;

      // Get other participants' info
      const otherParticipantIds = chat.participants
        .map((p) => p.userId)
        .filter((id) => id !== userId);

      const otherParticipants: BaseUser[] = [];
      for (const participantId of otherParticipantIds) {
        const participantRef = doc(db, 'users', participantId);
        const participantSnap = await getDoc(participantRef);
        if (participantSnap.exists()) {
          const participantData = participantSnap.data();
          otherParticipants.push({
            id: participantSnap.id,
            username: participantData.username,
            displayName: participantData.displayName,
            avatarUrl: participantData.avatarUrl,
            status: participantData.status || 'offline',
          });
        }
      }

      chatSummaries.push({
        chatId: chat.id,
        type: chat.type,
        name: chat.name,
        otherParticipants,
        lastMessage: chat.lastMessage
          ? {
              ...chat.lastMessage,
              timestamp: convertTimestamp(
                chat.lastMessage.timestamp as Date | Timestamp
              ),
            }
          : undefined,
        unreadCount: chat.unreadCount || 0,
        updatedAt: convertTimestamp(
          (chat.lastMessage?.timestamp as Date | Timestamp) ||
            (chat.createdAt as Date | Timestamp)
        ),
      });
    }
  }

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
  if (data.lastMessage?.timestamp) {
    chat.lastMessage = {
      ...data.lastMessage,
      timestamp: convertTimestamp(
        data.lastMessage.timestamp as Date | Timestamp
      ),
    };
  }

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

  // Update chat's lastMessage and lastActivity
  const chatRef = doc(db, 'chats', chatId);
  await setDoc(
    chatRef,
    {
      lastMessage: {
        content: content.trim(),
        senderId,
        timestamp: serverTimestamp(),
      },
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
