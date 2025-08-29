import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export const POST = async (request: NextRequest) => {
  try {
    // Server-side validation: Check session cookie
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Verify the session cookie
    const decodedToken = await getAuth().verifyIdToken(sessionCookie);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Check if email is already verified
    const userRecord = await getAuth().getUser(decodedToken.uid);
    if (userRecord.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Return user data for client-side verification
    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      },
    });
  } catch (error: unknown) {
    console.error('Session verification error:', error);

    const firebaseError = error as { code?: string; message?: string };

    return NextResponse.json(
      {
        error: 'Session verification failed',
        message: firebaseError.message || 'An error occurred',
      },
      { status: 500 }
    );
  }
};
