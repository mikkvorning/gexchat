import { useState, useMemo } from 'react';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '../../app/muiImports';
import { BaseUser } from '../../types/types';
import SettingsIcon from '@mui/icons-material/Settings';
import { mockContacts } from '../../mock/mockData';
import { useAuth } from '../AuthProvider';
import { Settings } from '../Settings/Settings';
import { shouldUseWhiteText } from '../../utils/colors';

interface SidebarProps {
  onContactSelect: (contactId: string) => void;
}

// Helper function to filter and sort contacts
const filterContacts = (contacts: BaseUser[], searchValue: string) => {
  const filteredBySearch = contacts.filter((contact) =>
    contact.displayName.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Separate online and offline contacts
  const online = filteredBySearch.filter(
    (c) => c.status === 'online' || c.status === 'away'
  );
  const offline = filteredBySearch.filter((c) => c.status === 'offline');

  return { online, offline };
};

const generateAvatarColor = (id: string) => {
  // Use a simpler hash function that's stable between renders
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Get a positive hex color
  return `#${Math.abs(hash).toString(16).slice(0, 6).padEnd(6, '0')}`;
};

const Sidebar = ({ onContactSelect }: SidebarProps) => {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Generate stable color mappings that persist between renders
  const contactColors = useMemo(() => {
    return mockContacts.reduce(
      (acc, contact) => ({
        ...acc,
        [contact.id]: generateAvatarColor(contact.id),
      }),
      {} as Record<string, string>
    );
  }, []); // Empty deps since mockContacts is static

  // Filter contacts based on search and online status
  const { online, offline } = filterContacts(mockContacts, searchValue);

  return (
    <>
      <Paper
        sx={{
          width: 300,
          height: '100vh',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: 1,
          borderColor: 'divider',
          boxShadow: 1,
        }}
      >
        <Box flex={1} display='flex' flexDirection='column' p={2}>
          <Box display='flex' alignItems='center' mb={2}>
            <TextField
              label='Search contacts'
              variant='outlined'
              type='search'
              size='small'
              fullWidth
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </Box>

          <List>
            {/* Online Contacts Section */}
            {online.length > 0 && (
              <>
                <ListItem sx={{ px: 1 }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Online — {online.length}
                  </Typography>
                </ListItem>
                {online.map((contact) => (
                  <ListItem
                    onClick={() => onContactSelect(contact.id)}
                    sx={{
                      cursor: 'pointer',
                      gap: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    key={contact.id}
                  >
                    {' '}
                    <Avatar
                      alt={contact.displayName}
                      sx={{
                        bgcolor: contactColors[contact.id],
                        color: shouldUseWhiteText(contactColors[contact.id])
                          ? 'white'
                          : 'black',
                      }}
                    >
                      {contact.displayName.charAt(0).toUpperCase()}
                    </Avatar>
                    <ListItemText primary={contact.displayName} />
                  </ListItem>
                ))}
              </>
            )}

            {/* Offline Contacts Section */}
            {offline.length > 0 && (
              <>
                <ListItem sx={{ px: 1, mt: online.length > 0 ? 2 : 0 }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Offline — {offline.length}
                  </Typography>
                </ListItem>
                {offline.map((contact) => (
                  <ListItem
                    onClick={() => onContactSelect(contact.id)}
                    sx={{
                      cursor: 'pointer',
                      gap: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      opacity: 0.7,
                    }}
                    key={contact.id}
                  >
                    <Avatar alt={contact.displayName}>
                      {contact.displayName.charAt(0).toUpperCase()}
                    </Avatar>
                    <ListItemText primary={contact.displayName} />
                  </ListItem>
                ))}
              </>
            )}
          </List>
        </Box>

        {/* Bottom section for settings */}
        <Box p={2} display='flex' justifyContent='space-between'>
          <Button variant='text' color='primary'>
            <Typography variant='h6'>
              {user?.displayName || user?.email}
            </Typography>
          </Button>
          <IconButton onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Paper>

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default Sidebar;
