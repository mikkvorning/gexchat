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
      // Sign out of Firebase and clear auth context
      await signOut(auth);
      setUser(null);

      // Clear session cookie and redirect
      document.cookie =
        'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/login');
    }
  };

  return { logout };
};
