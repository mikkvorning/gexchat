'use client';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from './muiImports';
import Chat from '@/components/Chat/Chat';

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
    <Box display='flex'>
      <Sidebar />
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        minHeight='100vh'
        width={'100%'}
        p={2}
      >
        <Chat />
      </Box>
    </Box>
  );
};

export default Home;
