'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getErrorMessage } from '@/utils/errorMessages';

interface ResendVerificationResponse {
  success: boolean;
  user: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
}

const handleApiError = async (response: Response, data: unknown) => {
  // Session invalid, cleanup and redirect
  if (response.status === 401) {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('lastLoginEmail');
    } catch {}
    throw new Error('Session expired. Please log in again.');
  }

  // For all other errors, let getErrorMessage extract the proper message
  const errorMessage = getErrorMessage(data);
  throw new Error(errorMessage);
};

const validateAuthState = (serverUser: ResendVerificationResponse['user']) => {
  if (!serverUser)
    throw new Error('Invalid server response - missing user data');

  if (auth.currentUser) {
    // If Firebase auth exists, validate it matches server
    if (auth.currentUser.uid !== serverUser.uid)
      throw new Error('Authentication state mismatch. Please log in again.');
    if (auth.currentUser.email !== serverUser.email)
      throw new Error('Authentication state mismatch. Please log in again.');
  }
};

// Step 1: Server-side validation via API
const resendVerificationEmail = async (): Promise<string> => {
  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData: unknown = await response.json();
    await handleApiError(response, errorData);
  }

  const data: ResendVerificationResponse = await response.json();

  // Step 2: Validate auth state synchronization (for security)
  validateAuthState(data.user);

  // Step 3: Send email via Firebase
  if (!auth.currentUser) {
    // For verification, we need to sign in the user client-side first
    // This is a limitation of Firebase - we need client auth to send verification emails
    throw new Error(
      'Firebase client authentication required. Please log out and log back in.'
    );
  }

  try {
    await sendEmailVerification(auth.currentUser);
  } catch (firebaseError) {
    throw firebaseError; // Re-throw to preserve the original error for centralized handling
  }

  return 'Verification email resent. Please check your inbox and spam folder.';
};

export const useResendVerification = () => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: resendVerificationEmail,
    retry: false,
    onError: (error: Error) => {
      // Handle auth state mismatches and session issues with delayed redirect
      if (
        error.message.includes('log in again') ||
        error.message.includes('Authentication state mismatch') ||
        error.message.includes('Session expired')
      ) {
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    },
  });

  return mutation;
};
