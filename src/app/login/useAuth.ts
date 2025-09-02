import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthContext } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginRequest {
  email: string;
  password: string;
  isSignup: boolean;
  nickname?: string;
}

export const useAuth = () => {
  const router = useRouter();
  const { setUser } = useAuthContext();

  return useMutation({
    mutationFn: authService.authenticate,
    retry: false,
    onSuccess: async (data, variables: LoginRequest) => {
      // Handle the complete login process
      if (variables.isSignup) {
        localStorage.setItem('lastLoginEmail', variables.email);
        router.replace('/verify');
        return;
      }

      if (!data.user.emailVerified) {
        localStorage.setItem('lastLoginEmail', variables.email);
        router.replace('/verify');
        return;
      }

      // Complete the login: sync client-side Firebase auth state
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          variables.email,
          variables.password
        );
        setUser(userCredential.user);

        // Force token refresh to ensure latest email_verified claim
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
      } catch (error) {
        // Continue anyway since server-side auth succeeded
        console.warn(
          'Client-side Firebase sync failed, but server auth succeeded:',
          error
        );
      }

      router.replace('/');
    },
  });
};
