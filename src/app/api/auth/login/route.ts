import { NextRequest, NextResponse } from 'next/server';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { handleAuthError } from '@/lib/apiUtils';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Shared user document data builder
const buildUserDocumentData = (
  uid: string,
  displayName: string,
  isGuest: boolean,
) => ({
  id: uid,
  displayName,
  username: isGuest
    ? `guest_${displayName.toLowerCase().replace(/\s+/g, '_')}`
    : displayName.toLowerCase().replace(/\s+/g, ''),
  isGuest,
  status: 'offline',
  chats: [],
  createdAt: new Date(),
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
  friends: {
    list: [],
    pending: [],
  },
  blocked: [],
});

// Helper function to create user document in Firestore (for regular users)
const createUserDocument = async (uid: string, displayName: string) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, buildUserDocumentData(uid, displayName, false));
};

// Helper function to create guest user document with Admin SDK
const createGuestUserDocument = async (uid: string, displayName: string) => {
  await adminDb
    .collection('users')
    .doc(uid)
    .set(buildUserDocumentData(uid, displayName, true));
};

export const POST = async (request: NextRequest) => {
  try {
    const { authType, email, password, nickname } = await request.json();

    let userCredential;

    if (authType === 'guest') {
      // Handle guest account creation using Admin SDK
      const userRecord = await adminAuth.createUser({
        displayName: nickname,
      });

      // Create user document in Firestore using Admin SDK
      await createGuestUserDocument(userRecord.uid, nickname);

      // Create a custom token for the client to use
      const customToken = await adminAuth.createCustomToken(userRecord.uid);

      // Return custom token - client will sign in and establish session
      return NextResponse.json({
        success: true,
        customToken,
        user: {
          uid: userRecord.uid,
          displayName: userRecord.displayName || nickname,
          email: '',
          emailVerified: false,
        },
      });
    } else if (authType === 'signup') {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Create user document
      await createUserDocument(userCredential.user.uid, nickname);

      // Send verification email
      await sendEmailVerification(userCredential.user);
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password);

      // For existing users logging in, ensure they have a user document
      // This handles legacy users who might not have documents yet
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create user document for legacy user
        const displayName =
          userCredential.user.displayName ||
          userCredential.user.email?.split('@')[0] ||
          'User';
        await createUserDocument(userCredential.user.uid, displayName);
      }
    }

    const user = userCredential.user;

    // Get the Firebase ID token
    const idToken = await user.getIdToken();

    // Create response with secure httpOnly cookies
    const response = NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
      },
    });

    // Set session cookie with the Firebase ID token
    response.cookies.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/',
    });

    // Set email verification status (true for guests, actual status for others)
    response.cookies.set(
      'emailVerified',
      authType === 'guest' ? 'true' : user.emailVerified.toString(),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 5, // 5 days
        path: '/',
      },
    );
    return response;
  } catch (error) {
    return handleAuthError(error);
  }
};
