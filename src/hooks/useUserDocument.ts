/**
 * Manages Firestore user document creation and updates.
 * Handles the creation of user documents after email verification,
 * with built-in retry logic and validation.
 * 
 * @module hooks/useUserDocument
 */

import { User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Hook for managing user documents in Firestore
 * @returns Methods for creating and managing user documents
 */
export const useUserDocument = () => {
  const createUserDocument = async (user: User, nickname?: string) => {
    if (!user.emailVerified) {
      throw new Error('User must be verified before creating document');
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const displayName =
        nickname || user.displayName || user.email?.split('@')[0] || 'User';

      const userDoc = {
        id: user.uid,
        email: user.email,
        displayName,
        username: displayName.toLowerCase(),
        avatarUrl: user.photoURL || '',
        status: 'online',
        createdAt: serverTimestamp(),
        chats: [],
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
        friends: {
          list: [],
          pending: [],
        },
        blocked: [],
      };

      // Attempt to create with retry
      try {
        await setDoc(userDocRef, userDoc);
      } catch {
        // One retry after a short delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await setDoc(userDocRef, userDoc);
      }
    }
  };

  return { createUserDocument };
};
