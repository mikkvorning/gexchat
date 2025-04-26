'use client';

import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';

export const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error?: Error | undefined;
  setUser: (user: User | null) => void;
}>({
  user: null,
  loading: true,
  setUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const value = { user, loading, error, setUser };

  const [authUser, authLoading, authError] = useAuthState(auth);

  useEffect(() => {
    setUser(authUser ?? null);
    setLoading(authLoading);
    setError(authError);
  }, [authUser, authLoading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
