'use client';

import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService } from '@/services/authService';

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
  const [authUser, authLoading, authError] = useAuthState(auth);

  // Validate that Firebase auth matches server session
  useEffect(() => {
    const validateAuthState = async () => {
      if (authUser) {
        try {
          // Check if server session is valid using authService
          const data = await authService.verifySession();

          // Only accept Firebase user if server confirms the session
          if (data.user?.uid === authUser.uid) setUser(authUser);
          else {
            // Session mismatch - someone might be spoofing
            await auth.signOut();
            setUser(null);
          }
        } catch {
          // Server session invalid - clear client auth
          await auth.signOut();
          setUser(null);
        }
      }
      // No Firebase user
      else setUser(null);

      setLoading(authLoading);
      setError(authError);
    };

    validateAuthState();
  }, [authUser, authLoading, authError]);

  return (
    <AuthContext.Provider value={{ user, loading, error, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
