'use client';

import * as React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../theme';
import EmotionRegistry from '@/lib/emotion-registry';

export default function MuiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmotionRegistry>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </EmotionRegistry>
  );
}
