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
      onClose();
    },
  });

  const onSearch = () => {
    if (searchTerm) refetch();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>Search & Add Contacts</DialogTitle>
      <DialogContent>
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
          sx={{ mt: 1, mb: 2 }}
          variant='outlined'
          fullWidth
        >
          Search
        </Button>
        <List>
          {searchResults.map((result) => (
            <ListItem
              key={result.id}
              secondaryAction={
                <Button
                  disabled={isAdding}
                  variant='contained'
                  color='primary'
                  onClick={() => handleAddContact({ contactId: result.id })}
                >
                  {isAdding ? 'Adding...' : 'Add'}
                </Button>
              }
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
        <Button onClick={onClose} color='inherit'>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddContact;
