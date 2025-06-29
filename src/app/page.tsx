'use client';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from './muiImports';
import Chat from '@/components/Chat/Chat';
import { AppProvider } from '@/components/AppProvider';
import { useRecentMessages } from '@/hooks/useRecentMessages';

const Home = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Set up global chat listener for real-time updates across all chats
  useRecentMessages(user?.uid);

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
    <Box display='flex' height='100vh'>
      <AppProvider contacts={[]}>
        <Sidebar />
        <Chat />
      </AppProvider>
    </Box>
  );
};

export default Home;
