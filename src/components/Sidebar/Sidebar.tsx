import { useState } from 'react';
import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
} from '../../app/muiImports';
import SettingsIcon from '@mui/icons-material/Settings';

const mockContactList = [
  { id: 1, name: 'Dennis Reynolds' },
  { id: 2, name: 'Charlie' },
  { id: 3, name: 'Mac' },
  { id: 4, name: 'Dee' },
  { id: 5, name: 'Frank' },
  { id: 6, name: 'Rickety Cricket' },
  { id: 7, name: 'Waitress' },
];

const Sidebar = () => {
  const [filteredContacts, setFilteredContacts] = useState(mockContactList);

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
        {/* Input search field with debounce that filters contacts */}
        <TextField
          label='Search messages'
          variant='outlined'
          type='search'
          size='small'
          fullWidth
          onChange={(e) => {
            const value = e.target.value.toLowerCase();
            setFilteredContacts(
              mockContactList.filter((contact) =>
                contact.name.toLowerCase().includes(value)
              )
            );
          }}
        />
        <List>
          {filteredContacts.map((contact) => (
            <ListItem
              component='div'
              sx={{ cursor: 'pointer', gap: 1 }}
              key={contact.id}
            >
              <Avatar
                alt={contact.name}
                src={`https://api.adorable.io/avatars/40/${contact.id}.png`}
                sx={{
                  bgcolor: `#${Math.floor(Math.random() * 16777215).toString(
                    16
                  )}`,
                }}
              />
              <ListItemText primary={contact.name} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Bottom section for settings */}
      <Box p={2} display='flex' justifyContent='flex-end'>
        <IconButton>
          <SettingsIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default Sidebar;
