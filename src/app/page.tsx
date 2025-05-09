'use client';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from './muiImports';

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
    <Box>
      <Sidebar />
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        minHeight='100vh'
        p={6}
      >
        <Typography variant='h4' mb={4}>
          Welcome, {user.email || 'User'}!
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;
