'use client';

import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService } from '@/services/authService';
import { doc, getDoc } from 'firebase/firestore';

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
          // Fetch user document to check if they're a guest
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          const isGuest = userDoc.exists() && userDoc.data()?.isGuest === true;

          if (isGuest) {
            // Guest users don't have server sessions - skip verification
            setUser(authUser);
          } else {
            // Regular users need server session validation
            const data = await authService.verifySession();

            // Only accept Firebase user if server confirms the session
            if (data.user?.uid === authUser.uid) {
              setUser(authUser);
            } else {
              // Session mismatch - someone might be spoofing
              await auth.signOut();
              setUser(null);
            }
          }
        } catch (err) {
          console.error('[AuthProvider] Failed to validate auth state:', err);
          if (err instanceof Error) {
            setError(err);
          } else {
            setError(
              new Error('Unknown error occurred while validating auth state'),
            );
          }
          // Error fetching user doc or verifying session - clear auth
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
