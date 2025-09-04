'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuthContext } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { authService } from '@/services/authService';

export const useLogout = () => {
  const router = useRouter();
  const { setUser } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear user context first to trigger cleanup of listeners
      setUser(null);

      // Clear all React Query cache to remove user-specific data
      queryClient.clear();

      // Call the secure logout API
      await authService.logout();

      // Sign out of Firebase
      await signOut(auth);
    },
    retry: false,
    onSuccess: () => {
      router.replace('/login');
    },
    // Let React Query handle errors - they'll be displayed in UI
  });
};
