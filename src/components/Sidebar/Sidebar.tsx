import React, { useState } from 'react';
import { Box, IconButton, Paper } from '../../app/muiImports';
import SettingsIcon from '@mui/icons-material/Settings';
import { mockContacts } from '../../mock/mockData';
import { Settings } from '../Settings/Settings';
import ChatSearch from './ChatSearch/ChatSearch';
import ChatList from './ChatList/ChatList';
import { SidebarProvider } from './SidebarProvider';

interface SidebarProps {
  onContactSelect: (contactId: string) => void;
}

const SidebarContent: React.FC<SidebarProps> = ({ onContactSelect }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          <ChatList onContactSelect={onContactSelect} />
        </Box>

        {/* Settings Button */}
        <Box p={2} borderTop={1} borderColor='divider'>
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

const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <SidebarProvider contacts={mockContacts}>
      <SidebarContent {...props} />
    </SidebarProvider>
  );
};

export default Sidebar;
