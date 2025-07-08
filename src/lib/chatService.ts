import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  arrayUnion,
  updateDoc,
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
      unreadMessages: [], // Initialize with empty unread messages array
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

      // Use simple array-based unread count
      const participant = chat.participants.find((p) => p.userId === userId);
      const unreadCount = participant?.unreadMessages?.length || 0;

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

    // Add message ID to unread arrays for all participants except the sender
    const participants = chat.participants.map((participant) => {
      if (participant.userId !== senderId) {
        const currentUnread = participant.unreadMessages || [];
        return {
          ...participant,
          unreadMessages: [...currentUnread, newMessageRef.id],
        };
      }
      return participant;
    });

    batch.update(chatRef, {
      participants,
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
 * Mark all messages as read for a specific user in a chat
 *
 * This function clears all unread messages for the user in the chat and
 * updates their last read timestamp. Optimized for simplicity and performance.
 *
 * Firebase operations performed:
 * 1. getDoc - Get chat to find participant index (minimal read)
 * 2. updateDoc - Update only the specific participant's unread array
 *
 * @param chatId - The ID of the chat to mark messages as read
 * @param userId - The ID of the user marking messages as read
 * @throws Error if chat ID or user ID is missing, or if user not found in chat
 */
export const markMessagesAsRead = async (
  chatId: string,
  userId: string
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

  // Update only the specific participant's unread messages and timestamp
  const participants = [...chat.participants];
  participants[participantIndex] = {
    ...participants[participantIndex],
    lastReadTimestamp: new Date(),
    unreadMessages: [], // Clear all unread messages
  };

  await updateDoc(chatRef, { participants });
};

/**
 * Get read receipt information for a message (respects privacy settings)
 */

/**
 * Subscribe to real-time chat data and messages for a chat view/page
 *
 * This function provides both chat metadata and messages in a single subscription,
 * optimized for individual chat pages where users view and send messages.
 *
 * @param chatId - The ID of the chat to subscribe to
 * @param onChatChange - Callback for chat metadata updates (participants, settings, etc.)
 * @param onMessagesChange - Callback for message updates (new messages, edits, etc.)
 * @returns Unsubscribe function that cleans up both listeners
 */
export const subscribeToChatView = (
  chatId: string,
  onChatChange: (chat: Chat | null) => void,
  onMessagesChange: (messages: Message[]) => void
): Unsubscribe => {
  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  // Subscribe to chat metadata
  const chatRef = doc(db, 'chats', chatId);
  const chatUnsubscribe = onSnapshot(
    chatRef,
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const chat = { id: doc.id, ...data } as Chat;
        chat.createdAt = convertTimestamp(data.createdAt as Date | Timestamp);
        onChatChange(chat);
      } else {
        onChatChange(null);
      }
    },
    (error) => {
      console.error('Error in chat subscription:', error);
    }
  );

  // Subscribe to messages
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
  const messagesUnsubscribe = onSnapshot(
    messagesQuery,
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

      onMessagesChange(messages);
    },
    (error) => {
      console.error('Error in messages subscription:', error);
    }
  );

  // Return cleanup function that unsubscribes from both
  return () => {
    chatUnsubscribe();
    messagesUnsubscribe();
  };
};

/**
 * Legacy function - use subscribeToChatView instead
 * @deprecated Use subscribeToChatView for better performance and simpler component logic
 */
export const subscribeToFullChat = (
  chatId: string,
  onChatChange: (chat: Chat | null) => void,
  onMessagesChange: (messages: Message[]) => void
): Unsubscribe => {
  return subscribeToChatView(chatId, onChatChange, onMessagesChange);
};

/**
 * Legacy function - use subscribeToChatView instead
 * @deprecated Use subscribeToChatView for better performance and simpler component logic
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  return subscribeToChatView(chatId, () => {}, callback);
};

/**
 * Legacy function - use subscribeToChatView instead
 * @deprecated Use subscribeToChatView for better performance and simpler component logic
 */
export const subscribeToChat = (
  chatId: string,
  callback: (chat: Chat | null) => void
): Unsubscribe => {
  return subscribeToChatView(chatId, callback, () => {});
};

/**
 * Simplified chat list subscription - minimal data for chat list display
 *
 * Only provides: unread count, last message, and chat/participant names
 *
 * @param userId - The ID of the user whose chat list to subscribe to
 * @param callback - Callback function that receives updated chat summaries
 * @returns Unsubscribe function that cleans up all listeners
 */
export const subscribeToChatList = (
  userId: string,
  callback: (chats: ChatSummary[]) => void
): Unsubscribe => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  let chatUnsubscribes: Unsubscribe[] = [];
  const userRef = doc(db, 'users', userId);

  const userUnsubscribe = onSnapshot(userRef, async (userSnap) => {
    // Clean up existing subscriptions
    chatUnsubscribes.forEach((unsub) => unsub());
    chatUnsubscribes = [];

    if (!userSnap.exists()) {
      callback([]);
      return;
    }

    const chatIds: string[] = userSnap.data().chats || [];
    if (chatIds.length === 0) {
      callback([]);
      return;
    }

    const buildSummaries = async () => {
      try {
        // Get all chats and their last messages in parallel
        const results = await Promise.all(
          chatIds.map(async (chatId) => {
            const [chatSnap, lastMessageSnap] = await Promise.all([
              getDoc(doc(db, 'chats', chatId)),
              getDocs(
                query(
                  collection(db, 'chats', chatId, 'messages'),
                  orderBy('timestamp', 'desc'),
                  limit(1)
                )
              ),
            ]);

            if (!chatSnap.exists()) return null;

            const chat = { id: chatSnap.id, ...chatSnap.data() } as Chat;
            const participant = chat.participants.find(
              (p) => p.userId === userId
            );
            const unreadCount = participant?.unreadMessages?.length || 0;

            // Get last message
            let lastMessage: Message | undefined;
            if (!lastMessageSnap.empty) {
              const messageData = lastMessageSnap.docs[0].data();
              lastMessage = {
                id: lastMessageSnap.docs[0].id,
                chatId,
                senderId: messageData.senderId,
                content: messageData.content,
                timestamp: convertTimestamp(
                  messageData.timestamp as Date | Timestamp
                ),
                edited: messageData.edited || false,
                readBy: messageData.readBy || [],
              } as Message;
            }

            // Get other participant names (only if needed)
            const otherParticipants: BaseUser[] = [];
            if (chat.type === 'direct') {
              const otherParticipant = chat.participants.find(
                (p) => p.userId !== userId
              );
              if (otherParticipant) {
                const userSnap = await getDoc(
                  doc(db, 'users', otherParticipant.userId)
                );
                otherParticipants.push({
                  id: otherParticipant.userId,
                  displayName: userSnap.exists()
                    ? userSnap.data().displayName || 'Unknown User'
                    : 'Unknown User',
                  username: '',
                  status: 'offline',
                });
              }
            }

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

        // Filter out nulls and sort by last activity
        const summaries = results
          .filter((summary): summary is ChatSummary => summary !== null)
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

        callback(summaries);
      } catch (error) {
        console.error('Error building chat summaries:', error);
        callback([]);
      }
    };

    // Subscribe to each chat for real-time updates
    chatIds.forEach((chatId) => {
      const chatUnsub = onSnapshot(doc(db, 'chats', chatId), buildSummaries);
      const messageUnsub = onSnapshot(
        query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('timestamp', 'desc'),
          limit(1)
        ),
        buildSummaries
      );
      chatUnsubscribes.push(chatUnsub, messageUnsub);
    });

    buildSummaries(); // Initial load
  });

  return () => {
    userUnsubscribe();
    chatUnsubscribes.forEach((unsub) => unsub());
  };
};

/**
 * Legacy function - use subscribeToChatList instead
 * @deprecated Use subscribeToChatList for clearer naming and better documentation
 */
export const subscribeToUserChats = (
  userId: string,
  callback: (chats: ChatSummary[]) => void
): Unsubscribe => {
  return subscribeToChatList(userId, callback);
};
