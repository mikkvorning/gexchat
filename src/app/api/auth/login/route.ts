import { NextRequest, NextResponse } from 'next/server';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { handleAuthError } from '@/lib/apiUtils';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const POST = async (request: NextRequest) => {
  try {
    const { email, password, isSignup, nickname } = await request.json();

    let userCredential;

    if (isSignup) {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: nickname,
      });

      // Create user document in Firestore immediately
      // This ensures users are searchable even before email verification
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        id: userCredential.user.uid,
        displayName: nickname,
        username: nickname.toLowerCase().replace(/\s+/g, ''), // Remove spaces for username
        email: email,
        status: 'offline',
        chats: [],
        createdAt: new Date(),
        // Privacy settings - default to conservative settings
        privacy: {
          showStatus: true,
          showLastSeen: true,
          showActivity: true,
        },
        // Notification preferences - default enabled
        notifications: {
          enabled: true,
          sound: true,
          muteUntil: null,
        },
        // Friend management
        friends: {
          list: [],
          pending: [],
        },
        // User blocking
        blocked: [],
      });

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
        await setDoc(userRef, {
          id: userCredential.user.uid,
          displayName:
            userCredential.user.displayName ||
            userCredential.user.email?.split('@')[0] ||
            'User',
          username: (
            userCredential.user.displayName ||
            userCredential.user.email?.split('@')[0] ||
            'user'
          )
            .toLowerCase()
            .replace(/\s+/g, ''),
          email: userCredential.user.email!,
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
        email: user.email,
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

    // Set email verification status
    response.cookies.set('emailVerified', user.emailVerified.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: '/',
    });

    return response;
  } catch (error) {
    return handleAuthError(error);
  }
};
