'use client';

import { useAuthContext } from '@/components/AuthProvider';
import { Box, Button, TextField, Typography } from '@/app/muiImports';
import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getErrorMessage } from '@/utils/errorMessages';

export const ProfileSettings = () => {
  const { user } = useAuthContext();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName,
      });

      // Update Firestore user document - only update displayName, never username
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
      });
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Something went wrong. Please try again.';

      if (error instanceof Error) errorMessage = getErrorMessage(error.message);
      else if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        errorMessage = getErrorMessage(firebaseError.code);
      }

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Profile Settings
      </Typography>
      <Box sx={{ maxWidth: 400, mt: 3 }}>
        <TextField
          fullWidth
          label='Email'
          value={user?.email || ''}
          disabled
          sx={{ mb: 3 }}
        />
        <TextField
          fullWidth
          label='Display Name'
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          sx={{ mb: 3 }}
        />
        {error && (
          <Typography color='error' variant='body2' sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || displayName === user?.displayName}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};
