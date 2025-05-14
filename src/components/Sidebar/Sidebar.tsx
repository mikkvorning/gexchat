import { useState } from 'react';
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
import SettingsIcon from '@mui/icons-material/Settings';
import { mockContacts } from '../../mock/mockData';
import { useAuth } from '../AuthProvider';

interface SidebarProps {
  onContactSelect: (contactId: string) => void;
}

const Sidebar = ({ onContactSelect }: SidebarProps) => {
  const { user } = useAuth();
  const [filteredContacts, setFilteredContacts] = useState(mockContacts);
  return (
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
        <TextField
          label='Search contacts'
          variant='outlined'
          type='search'
          size='small'
          fullWidth
          onChange={(e) => {
            const value = e.target.value.toLowerCase();
            setFilteredContacts(
              mockContacts.filter((contact) =>
                contact.displayName.toLowerCase().includes(value)
              )
            );
          }}
        />
        <List>
          {filteredContacts.map((contact) => (
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
              <Avatar
                alt={contact.displayName}
                sx={{
                  position: 'relative',
                  '&::after':
                    contact.status === 'online'
                      ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 2,
                          right: 2,
                          width: 8,
                          height: 8,
                          bgcolor: 'success.main',
                          borderRadius: '50%',
                          border: '2px solid #fff',
                        }
                      : undefined,
                }}
              />
              <ListItemText
                primary={contact.displayName}
                secondary={
                  contact.status === 'online'
                    ? 'Online'
                    : contact.status === 'away'
                    ? 'Away'
                    : 'Offline'
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Bottom section for settings */}
      <Box p={2} display='flex' justifyContent='space-between'>
        <Button variant='text' color='primary'>
          <Typography variant='body2'>{user?.email}</Typography>
        </Button>
        <IconButton>
          <SettingsIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default Sidebar;
