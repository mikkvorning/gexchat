import SettingsIcon from '@mui/icons-material/Settings';
import React, { useState } from 'react';
import { Box, Button, IconButton, Paper } from '../../app/muiImports';
import { useAuth } from '../AuthProvider';
import { Settings } from '../Settings/Settings';
import ChatList from './ChatList/ChatList';
import ChatSearch from './ChatSearch/ChatSearch';

const Sidebar: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user } = useAuth();

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
          <ChatSearch />
          <ChatList />
        </Box>
        {/* Settings Button */}
        <Box
          p={2}
          borderTop={1}
          borderColor='divider'
          display='flex'
          justifyContent='space-between'
        >
          {/* Display username */}
          <Button variant='text' size='large'>
            {user?.displayName || user?.email || 'User'}
          </Button>

          <IconButton
            onClick={() => setSettingsOpen(true)}
            sx={{ borderRadius: 1 }}
            size='large'
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Paper>
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default Sidebar;
