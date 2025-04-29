'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import { Box, Typography, Paper, Button, CircularProgress } from './muiImports';

const Home = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        minHeight='100vh'
        p={6}
      >
        <CircularProgress />
        <Typography variant='h6' mt={2}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return null; // Redirecting
  }

  return (
    <Box display='flex' minHeight='100vh'>
      <Sidebar />
      <Box
        flex={1}
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        p={6}
      >
        <Paper
          elevation={3}
          sx={{
            p: 5,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography variant='h4' fontWeight={700} mb={2} color='text.primary'>
            Welcome to GexChat
          </Typography>
          <Typography color='text.secondary' mb={2}>
            You are logged in. Enjoy chatting!
          </Typography>
          <Button variant='contained' color='primary'>
            Primary
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Home;
