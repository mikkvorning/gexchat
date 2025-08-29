'use client';

import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export const useLogout = () => {
  const router = useRouter();
  const { setUser } = useAuth();

  const logout = async () => {
    try {
      // Call the secure logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      // Sign out of Firebase and clear auth context
      await signOut(auth);
      setUser(null);

      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/login');
    }
  };

  return { logout };
};
