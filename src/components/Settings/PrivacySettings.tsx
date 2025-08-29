'use client';

import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@/app/muiImports';
import { useState } from 'react';

export const PrivacySettings = () => {
  const [settings, setSettings] = useState({
    onlineStatus: 'all',
    lastSeen: true,
    readReceipts: true,
    typing: true,
  });

  const handleStatusChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      onlineStatus: value,
    }));
  };

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]:
        typeof prev[setting] === 'boolean' ? !prev[setting] : prev[setting],
    }));
  };

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Privacy & Security Settings
      </Typography>

      <Box sx={{ mt: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Who can see my online status</InputLabel>
          <Select
            value={settings.onlineStatus}
            label='Who can see my online status'
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <MenuItem value='all'>Everyone</MenuItem>
            <MenuItem value='contacts'>Contacts Only</MenuItem>
            <MenuItem value='none'>Nobody</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={settings.lastSeen}
              onChange={() => handleToggle('lastSeen')}
            />
          }
          label='Show last seen'
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.readReceipts}
              onChange={() => handleToggle('readReceipts')}
            />
          }
          label='Send read receipts'
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.typing}
              onChange={() => handleToggle('typing')}
            />
          }
          label="Show when I'm typing"
        />

        <Box sx={{ mt: 4 }}>
          <Button
            variant='outlined'
            color='error'
            onClick={() => {
              // TODO: Implement account deletion
            }}
          >
            Delete Account
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
