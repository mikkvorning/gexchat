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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
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
  const handleStartChat = (userId: string, displayName: string) => {
    // TODO: Implement start chat functionality
    console.log('Starting chat with:', displayName);
    handleDialogClose();
  };

  const handleAddAsContact = (userId: string) => {
    handleAddContact({ contactId: userId });
  };

  const handleAccordionChange =
    (userId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedUserId(isExpanded ? userId : null);
    };
  const onSearch = () => {
    if (searchTerm) refetch();
  };
  const handleDialogClose = () => {
    setExpandedUserId(null);
    setSearchTerm('');
    onClose();
  };
  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth='sm'>
      <DialogTitle>Search & Add Contacts</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

        <Box sx={{ mt: 1 }}>
          {searchResults.map((result) => (
            <Accordion
              key={result.id}
              expanded={expandedUserId === result.id}
              onChange={handleAccordionChange(result.id)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-${result.id}-content`}
                id={`panel-${result.id}-header`}
              >
                <Typography variant='subtitle1' sx={{ fontWeight: 'medium' }}>
                  {result.displayName}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      gutterBottom
                    >
                      Profile Information
                    </Typography>
                    <Typography variant='body1' sx={{ mb: 1 }}>
                      <strong>Name:</strong> {result.displayName}
                    </Typography>
                    <Typography variant='body1' sx={{ mb: 1 }}>
                      <strong>Email:</strong> {result.email}
                    </Typography>
                    {/* Add more profile fields here as needed */}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={() =>
                        handleStartChat(result.id, result.displayName)
                      }
                      fullWidth
                    >
                      Start Chat
                    </Button>
                    <Button
                      variant='outlined'
                      color='secondary'
                      onClick={() => handleAddAsContact(result.id)}
                      disabled={isAdding}
                      fullWidth
                    >
                      {isAdding ? 'Adding...' : 'Add Friend'}
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
          {searchResults.length === 0 && searchTerm && !isFetching && (
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ textAlign: 'center', py: 2 }}
            >
              No users found
            </Typography>
          )}
        </Box>
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
