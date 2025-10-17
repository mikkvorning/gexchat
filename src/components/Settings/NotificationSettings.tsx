'use client';

import { Box, FormControlLabel, Switch, Typography } from '@/app/muiImports';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

export const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    enableNotifications: true,
    soundEnabled: true,
    messagePreview: true,
    mentionAlerts: true,
  });

  const handleChange = (setting: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
    enqueueSnackbar('Feature not yet available', {
      variant: 'info',
    });
  };

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Notification Settings
      </Typography>

      <Box sx={{ mt: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.enableNotifications}
              onChange={() => handleChange('enableNotifications')}
            />
          }
          label='Enable Notifications'
        />
        <Box sx={{ ml: 3, mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.soundEnabled}
                onChange={() => handleChange('soundEnabled')}
                disabled={!settings.enableNotifications}
              />
            }
            label='Enable Sound'
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.messagePreview}
                onChange={() => handleChange('messagePreview')}
                disabled={!settings.enableNotifications}
              />
            }
            label='Show Message Preview'
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.mentionAlerts}
                onChange={() => handleChange('mentionAlerts')}
                disabled={!settings.enableNotifications}
              />
            }
            label='Notify on Mentions'
          />
        </Box>
      </Box>
    </Box>
  );
};
