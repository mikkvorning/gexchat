import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService, AuthRequest } from '@/services/authService';
import { useAuthContext } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

/**
 * Authentication hook for login and signup flows.
 *
 * This hook implements a hybrid authentication approach:
 * 1. Server-side validation via authService.authenticate (creates backend session)
 * 2. Firebase client authentication (enables Firebase features like email verification)
 * 3. Automatic routing based on user verification status
 *
 * Flow:
 * - Login/Signup → Backend validates → Firebase client auth → Route to verify or home
 * - Unverified users: Can access /verify page but restricted from main app
 * - Verified users: Full access to authenticated routes
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
      // Step 1: Establish Firebase client authentication
      // This is required for all authenticated users to enable Firebase features
      // like email verification, even if they're not yet verified
      const userCredential = await signInWithEmailAndPassword(
        auth,
        variables.email,
        variables.password
      );
      setUser(userCredential.user);

      // Step 2: Force token refresh to get latest email_verified claim
      // This ensures the Firebase token reflects the current verification status
      if (auth.currentUser) await auth.currentUser.getIdToken(true);

      // Step 3: Route based on verification status
      if (variables.isSignup || !data.user.emailVerified) {
        // Unverified users: Store email for verification page and redirect
        localStorage.setItem('lastLoginEmail', variables.email);
        router.replace('/verify');
      }
      // Verified users: Direct access to main application
      else router.replace('/');
    },
  });
};
