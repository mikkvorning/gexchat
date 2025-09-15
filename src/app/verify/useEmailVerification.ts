'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface VerificationResponse {
  user: {
    uid: string;
    email: string;
    emailVerified: boolean;
  };
}

const getStoredEmail = () => {
  try {
    return localStorage.getItem('lastLoginEmail');
  } catch {
    return null;
  }
};

export const useEmailVerification = () => {
  const router = useRouter();

  const query = useQuery({
    queryKey: ['emailVerification'],
    queryFn: async (): Promise<VerificationResponse> => {
      const response = await fetch('/api/auth/verify-session');

      if (!response.ok) {
        throw new Error('Session invalid');
      }

      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Handle navigation based on verification status
  useEffect(() => {
    if (query.data?.user) {
      if (query.data.user.emailVerified) {
        router.replace('/');
      }
    } else if (query.error) {
      router.replace('/login');
    }
  }, [query.data, query.error, router]);

  return {
    ...query,
    email: getStoredEmail(),
    isVerificationPending: query.data?.user && !query.data.user.emailVerified,
  };
};
