'use client';

import { useAuth } from '@/components/AuthProvider';
import { Box, Button, TextField, Typography } from '@/app/muiImports';
import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const ProfileSettings = () => {
  const { user } = useAuth();
  const [nickname, setNickname] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: nickname,
      });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        nickname: nickname,
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
          label='Nickname'
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || nickname === user?.displayName}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};
