import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatSummary, Message } from '../types/types';

// Helper function to convert Firestore Timestamp to Date
const convertTimestamp = (timestamp: Date | Timestamp | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  return new Date();
};

/**
 * Global hook that listens to last messages for ALL user chats
 * Updates chat list cache when any chat receives new messages
 */
export const useGlobalChatListener = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Listen to user's chat list to know which chats to monitor
    const userRef = doc(db, 'users', userId);

    const userUnsubscribe = onSnapshot(
      userRef,
      async (userDoc: DocumentSnapshot) => {
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const chatIds: string[] = userData.chats || [];

        if (chatIds.length === 0) return;

        // Clean up any existing listeners first
        // (This is handled by the outer useEffect cleanup)

        // Set up listeners for last message of each chat
        const messageUnsubscribers: (() => void)[] = [];

        chatIds.forEach((chatId) => {
          // Listen to only the last message of this chat
          const messagesRef = collection(db, 'chats', chatId, 'messages');
          const lastMessageQuery = query(
            messagesRef,
            orderBy('timestamp', 'desc'),
            limit(1)
          );

          const unsubscribe = onSnapshot(lastMessageQuery, (snapshot) => {
            if (snapshot.empty) return;

            const lastMessageDoc = snapshot.docs[0];
            const messageData = lastMessageDoc.data();

            const lastMessage: Message = {
              id: lastMessageDoc.id,
              chatId,
              senderId: messageData.senderId,
              content: messageData.content,
              timestamp: convertTimestamp(messageData.timestamp),
              edited: messageData.edited || false,
              replyTo: messageData.replyTo,
              attachments: messageData.attachments,
            };

            // Update the chat list cache with the new last message
            queryClient.setQueryData(
              ['userChats', userId],
              (oldChats: ChatSummary[] | undefined) => {
                if (!oldChats) return oldChats;

                return oldChats
                  .map((chat) => {
                    if (chat.chatId === chatId) {
                      return {
                        ...chat,
                        lastMessage,
                        updatedAt: lastMessage.timestamp,
                      };
                    }
                    return chat;
                  })
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime()
                  );
              }
            );
          });

          messageUnsubscribers.push(unsubscribe);
        });

        // Return cleanup function for message listeners
        return () => {
          messageUnsubscribers.forEach((unsubscribe) => unsubscribe());
        };
      }
    );

    // Cleanup function
    return () => {
      userUnsubscribe();
    };
  }, [userId, queryClient]);
};
