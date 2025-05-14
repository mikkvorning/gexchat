'use client';

import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@/app/muiImports';
import { useState } from 'react';

export const AppearanceSettings = () => {
  const [theme, setTheme] = useState('system');
  const [messageDisplay, setMessageDisplay] = useState('bubbles');

  return (
    <Box>
      <Typography variant='h6' gutterBottom>
        Appearance Settings
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Typography variant='subtitle1' gutterBottom>
          Theme
        </Typography>
        <FormControl>
          <RadioGroup value={theme} onChange={(e) => setTheme(e.target.value)}>
            <FormControlLabel value='light' control={<Radio />} label='Light' />
            <FormControlLabel value='dark' control={<Radio />} label='Dark' />
            <FormControlLabel
              value='system'
              control={<Radio />}
              label='System Default'
            />
          </RadioGroup>
        </FormControl>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant='subtitle1' gutterBottom>
          Message Display
        </Typography>
        <FormControl>
          <RadioGroup
            value={messageDisplay}
            onChange={(e) => setMessageDisplay(e.target.value)}
          >
            <FormControlLabel
              value='bubbles'
              control={<Radio />}
              label='Message Bubbles'
            />
            <FormControlLabel
              value='compact'
              control={<Radio />}
              label='Compact'
            />
          </RadioGroup>
        </FormControl>
      </Box>
    </Box>
  );
};
