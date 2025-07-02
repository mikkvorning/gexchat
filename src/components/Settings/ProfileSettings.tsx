'use client';

import { useAuth } from '@/components/AuthProvider';
import { Box, Button, TextField, Typography } from '@/app/muiImports';
import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const ProfileSettings = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName,
      });

      // Update Firestore user document - only update displayName, never username
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
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
