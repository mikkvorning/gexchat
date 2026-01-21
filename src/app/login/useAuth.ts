import { useAuthContext } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { AuthRequest, authService } from '@/services/authService';
import { useMutation } from '@tanstack/react-query';
import {
  signInWithCustomToken,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

/**
 * Creates a server session for guest users after client-side authentication.
 * @param idToken - Firebase ID token from authenticated user
 * @throws Error with code property for proper error message translation
 */
const createGuestSession = async (idToken: string): Promise<void> => {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    credentials: 'same-origin', // Ensure cookies are included
  });

  if (!response.ok) {
    const error = new Error('Failed to create session') as Error & {
      code?: string;
    };
    error.code = 'auth/session-creation-failed';
    throw error;
  }
};

/**
 * Authentication hook for login and signup flows.
 *
 * This hook implements a hybrid authentication approach with three paths:
 *
 * 1. GUEST ACCOUNTS:
 *    - Server creates anonymous user with Admin SDK
 *    - Returns custom token to client
 *    - Client signs in with custom token
 *    - Client establishes server session via /api/auth/session
 *    - Direct access to main application (no email verification needed)
 *
 * 2. SIGNUP (New Users):
 *    - Server creates user with email/password
 *    - Server sends verification email
 *    - Client signs in with credentials
 *    - Redirected to /verify page until email verified
 *
 * 3. LOGIN (Existing Users):
 *    - Server validates credentials
 *    - Client signs in with credentials
 *    - Verified users: Direct access to main application
 *    - Unverified users: Redirected to /verify page
 *
 * All flows establish httpOnly session cookies for secure server-side authentication.
 *
 * @returns React Query mutation for authentication operations
 */
export const useAuth = () => {
  const router = useRouter();
  const { setUser } = useAuthContext();

  return useMutation({
    mutationFn: authService.authenticate,
    retry: false,
    onSuccess: async (data, variables: AuthRequest) => {
      // Guest accounts: Sign in with custom token, then establish session
      if (variables.authType === 'guest' && data.customToken) {
        const userCredential = await signInWithCustomToken(
          auth,
          data.customToken,
        );
        const idToken = await userCredential.user.getIdToken();

        // Create server session
        await createGuestSession(idToken);

        setUser(userCredential.user);
        router.replace('/');
        return;
      } // Step 1: Establish Firebase client authentication
      // This is required for all authenticated users to enable Firebase features
      // like email verification, even if they're not yet verified
      const userCredential = await signInWithEmailAndPassword(
        auth,
        variables.email!,
        variables.password!,
      );
      setUser(userCredential.user);

      // Step 2: Force token refresh to get latest email_verified claim
      // This ensures the Firebase token reflects the current verification status
      if (auth.currentUser) await auth.currentUser.getIdToken(true);

      // Step 3: Route based on verification status
      if (variables.authType === 'signup' || !data.user.emailVerified) {
        // Unverified users: Store email for verification page and redirect
        localStorage.setItem('lastLoginEmail', variables.email!);
        router.replace('/verify');
      }
      // Verified users: Direct access to main application
      else router.replace('/');
    },
  });
};
