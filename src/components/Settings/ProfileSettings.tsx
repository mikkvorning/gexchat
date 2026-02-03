'use client';

import { Box, Button, TextField, Typography } from '@/app/muiImports';
import { useAuthContext } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { getErrorMessage } from '@/utils/errorMessages';
import { useMutation } from '@tanstack/react-query';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

export const ProfileSettings = () => {
  const { user } = useAuthContext();
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  const updateProfileMutation = useMutation({
    mutationFn: async (newDisplayName: string) => {
      if (!user) throw new Error('No user');
      await updateProfile(user, { displayName: newDisplayName });
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName,
      });
    },
    onError: (error: unknown) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
    onSuccess: () => {
      enqueueSnackbar('Profile updated', { variant: 'success' });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(displayName);
  };

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Profile Settings
      </Typography>
      <Box sx={{ maxWidth: 400, mt: 3 }}>
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
          disabled={
            updateProfileMutation.isPending || displayName === user?.displayName
          }
        >
          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};
