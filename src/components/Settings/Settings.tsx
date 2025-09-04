'use client';

import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Modal,
} from '@/app/muiImports';
import CloseIcon from '@mui/icons-material/Close';
import { ProfileSettings } from './ProfileSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { NotificationSettings } from './NotificationSettings';
import { PrivacySettings } from './PrivacySettings';
import { useState } from 'react';
import { LogoutButton } from '../LogoutButton';

const settingsPages = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy & Security' },
];

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export const Settings = ({ open, onClose }: SettingsProps) => {
  const [activePage, setActivePage] = useState('profile');

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiModal-backdrop': {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            width: 240,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant='h6' sx={{ flexGrow: 1 }}>
              Settings
            </Typography>
            <IconButton onClick={onClose} edge='end'>
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ flex: 1, overflow: 'auto' }}>
            {settingsPages.map((page) => (
              <ListItem key={page.id} disablePadding>
                <ListItemButton
                  selected={activePage === page.id}
                  onClick={() => setActivePage(page.id)}
                >
                  <ListItemText primary={page.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {/* Log out button */}
          <Box sx={{ p: 2 }}>
            <LogoutButton fullWidth showError />
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {activePage === 'profile' && <ProfileSettings />}
          {activePage === 'appearance' && <AppearanceSettings />}
          {activePage === 'notifications' && <NotificationSettings />}
          {activePage === 'privacy' && <PrivacySettings />}
        </Box>
      </Box>
    </Modal>
  );
};
