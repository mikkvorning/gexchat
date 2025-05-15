'use client';

import { useLogout } from '@/hooks/useLogout';
import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '../muiImports';

const LogoutPage = () => {
  const { logout } = useLogout();

  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      justifyContent='center'
      minHeight='100vh'
    >
      <CircularProgress />
      <Typography variant='h6' sx={{ mt: 2 }}>
        Signing out...
      </Typography>
    </Box>
  );
};

export default LogoutPage;
