'use client';

import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';

export const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error?: Error | undefined;
}>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, loading, error] = useAuthState(auth);

  return (
    <AuthContext.Provider value={{ user: user ?? null, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
