// A dialog popup with a search field for finding new contacts in the Firebase database.
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AddContactProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  email: string;
  displayName: string;
}

const searchUsers = async (searchTerm: string, currentUserId: string) => {
  if (!searchTerm) return [];
  const usersRef = collection(db, 'users');
  // Query by username only
  const usernameQuery = query(
    usersRef,
    where('username', '>=', searchTerm),
    where('username', '<=', searchTerm + '\uf8ff')
  );
  const usernameSnap = await getDocs(usernameQuery);
  const results: SearchResult[] = [];
  usernameSnap.forEach((doc) => {
    if (doc.id !== currentUserId) {
      const data = doc.data() as {
        email: string;
        displayName: string;
        username: string;
      };
      results.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
      });
    }
  });
  return results;
};

const addContact = async ({
  userId,
  contactId,
}: {
  userId: string;
  contactId: string;
}) => {
  if (!userId || !contactId) throw new Error('Missing user or contact ID');

  // Reference to the contact in the user's contacts subcollection
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  const contactSnap = await getDoc(contactRef);
  if (contactSnap.exists()) {
    throw new Error('Contact already added');
  }
  // Add the contact (you can add more fields as needed)
  await setDoc(contactRef, { addedAt: new Date() });
  return true;
};

const AddContact: React.FC<AddContactProps> = ({ open, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: searchResults = [],
    refetch,
    isFetching,
  } = useQuery<SearchResult[]>({
    queryKey: ['searchUsers', searchTerm, user?.uid],
    queryFn: () => searchUsers(searchTerm, user?.uid ?? ''),
    enabled: false,
  });
  const { mutate: handleAddContact, isPending: isAdding } = useMutation({
    mutationFn: ({ contactId }: { contactId: string }) =>
      addContact({ userId: user?.uid ?? '', contactId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.uid] });
      handleDialogClose();
    },
  });
  const handleStartChat = () => {
    if (!selectedUser) return;
    // TODO: Implement start chat functionality
    console.log('Starting chat with:', selectedUser.displayName);
    handleDialogClose();
  };

  const handleViewProfile = () => {
    if (!selectedUser) return;
    // TODO: Implement view profile functionality
    console.log('Viewing profile of:', selectedUser.displayName);
    handleDialogClose();
  };

  const handleAddAsContact = () => {
    if (!selectedUser) return;
    handleAddContact({ contactId: selectedUser.id });
  };
  const handleUserSelect = (result: SearchResult) => {
    setSelectedUser(result);
  };
  const onSearch = () => {
    if (searchTerm) refetch();
  };

  const handleDialogClose = () => {
    setSelectedUser(null);
    setSearchTerm('');
    onClose();
  };
  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth='xs'>
      {' '}
      <DialogTitle>
        {selectedUser
          ? `Selected: ${selectedUser.displayName}`
          : 'Search & Add Contacts'}
      </DialogTitle>{' '}
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <TextField
          fullWidth
          margin='dense'
          label='Search by username'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && onSearch()}
          InputProps={{
            endAdornment: isFetching ? <CircularProgress size={20} /> : null,
          }}
        />
        <Button
          onClick={onSearch}
          disabled={isFetching || !searchTerm}
          variant='outlined'
          fullWidth
        >
          Search
        </Button>

        <Stack flex={1} flexDirection={'row'} gap={1}>
          <Button
            variant='contained'
            color='primary'
            onClick={handleStartChat}
            disabled={!selectedUser}
            fullWidth
          >
            Chat
          </Button>
          <Button
            variant='outlined'
            color='primary'
            onClick={handleViewProfile}
            disabled={!selectedUser}
            fullWidth
          >
            Profile
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            onClick={handleAddAsContact}
            disabled={!selectedUser || isAdding}
            fullWidth
          >
            {isAdding ? 'Adding...' : 'Contact'}
          </Button>
        </Stack>

        <List>
          {searchResults.map((result) => (
            <ListItem
              key={result.id}
              onClick={() => handleUserSelect(result)}
              sx={{
                cursor: 'pointer',
                backgroundColor:
                  selectedUser?.id === result.id
                    ? 'action.selected'
                    : 'transparent',
                '&:hover': {
                  backgroundColor:
                    selectedUser?.id === result.id
                      ? 'action.selected'
                      : 'action.hover',
                },
              }}
            >
              <ListItemText
                primary={result.displayName}
                secondary={result.email}
              />
            </ListItem>
          ))}
          {searchResults.length === 0 && searchTerm && !isFetching && (
            <ListItem>
              <ListItemText primary='No users found' />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose} color='inherit'>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddContact;
