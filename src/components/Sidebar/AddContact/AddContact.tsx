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
import { useAuth } from '@/components/AuthProvider';
import { useAppContext } from '@/components/AppProvider';
import { useUserSearch, useCreateChat, useAddFriend } from '../hooks';

interface AddContactProps {
  open: boolean;
  onClose: () => void;
}

const AddContact: React.FC<AddContactProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { setSelectedChat } = useAppContext();

  // Separate hooks for different responsibilities
  const { searchTerm, setSearchTerm, searchResults, searchLoading } =
    useUserSearch(user?.uid);

  const { startChat, isCreatingChat } = useCreateChat(
    user?.uid,
    user?.displayName || undefined,
    (chatId) => {
      setSelectedChat(chatId);
      onClose();
    }
  );

  const { addFriend, isAddingFriend } = useAddFriend(user?.uid);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const handleAccordionChange =
    (userId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedUserId(isExpanded ? userId : null);
    };

  const handleDialogClose = () => {
    setExpandedUserId(null);
    setSearchTerm('');
    onClose();
  };

  const handleStartChat = (userId: string, username: string) => {
    startChat(userId, username);
  };

  const handleAddFriend = (friendId: string) => {
    addFriend(friendId);
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
          InputProps={{
            endAdornment: searchLoading ? <CircularProgress size={20} /> : null,
          }}
        />

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
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={() =>
                        handleStartChat(result.id, result.username)
                      }
                      disabled={isCreatingChat}
                      fullWidth
                    >
                      {isCreatingChat ? 'Starting...' : 'Start Chat'}
                    </Button>
                    <Button
                      variant='outlined'
                      color='secondary'
                      onClick={() => handleAddFriend(result.id)}
                      disabled={isAddingFriend}
                      fullWidth
                    >
                      {isAddingFriend ? 'Adding...' : 'Add Friend'}
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
          {searchResults.length === 0 && searchTerm && !searchLoading && (
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
