'use client';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from './muiImports';
import Chat from '@/components/Chat/Chat';
import GeminiBotChatView from '@/components/Sidebar/ChatList/GeminiBot/GeminiBotChatView';
import { useAppContext } from '@/components/AppProvider';
import { AppProvider } from '@/components/AppProvider';
import { useRecentMessages } from '@/hooks/useRecentMessages';

// Renders GeminiBotChatView if Gemini-bot is selected, otherwise normal Chat
const MainChatSwitcher = () => {
  const { selectedChat } = useAppContext();
  const { user } = useAuth();
  if (selectedChat === 'gemini-bot' && user?.uid) {
    return <GeminiBotChatView userId={user.uid} />;
  }
  return <Chat />;
};

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
        <MainChatSwitcher />
      </AppProvider>
    </Box>
  );
};

export default Home;
