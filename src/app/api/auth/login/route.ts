import { NextRequest, NextResponse } from 'next/server';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { handleAuthError } from '@/lib/apiUtils';

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

      // Send verification email
      await sendEmailVerification(userCredential.user);
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
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
