'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface ResendVerificationResponse {
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
  error?: string;
}

const handleApiError = async (
  response: Response,
  data: ResendVerificationResponse
) => {
  // Session invalid, cleanup
  if (response.status === 401) {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('lastLoginEmail');
    } catch {}
    throw new Error('Session expired. Please log in again.');
  } else if (response.status === 400)
    throw new Error('Email is already verified.');
  else throw new Error(data.error || 'Server validation failed');
};

const validateAuthState = (serverUser: ResendVerificationResponse['user']) => {
  if (!serverUser)
    throw new Error('Invalid server response - missing user data');
  if (!auth.currentUser)
    throw new Error('Please log in again to resend verification email.');
  if (auth.currentUser.uid !== serverUser.uid)
    throw new Error('Authentication state mismatch. Please log in again.');
  if (auth.currentUser.email !== serverUser.email)
    throw new Error('Authentication state mismatch. Please log in again.');
};

// Step 1: Server-side validation via API
const resendVerificationEmail = async (): Promise<string> => {
  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
  });

  const data: ResendVerificationResponse = await response.json();
  if (!response.ok) await handleApiError(response, data);

  // Step 2: Validate auth state synchronization
  validateAuthState(data.user);

  // Step 3: Send verification email - Firebase errors will bubble up naturally
  await sendEmailVerification(auth.currentUser!);

  return 'Verification email resent. Please check your inbox and spam folder.';
};

export const useResendVerification = () => {
  const router = useRouter();

  return useMutation({
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
};
