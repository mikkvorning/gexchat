import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { handleApiError } from '@/lib/apiUtils';

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

export const GET = async (request: NextRequest) => {
  try {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(sessionCookie);

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      },
    });
  } catch (error) {
    // Clear invalid session cookies on error
    const response = handleApiError(error, 401);
    response.cookies.delete('session');
    response.cookies.delete('emailVerified');
    return response;
  }
};
