'use client';
import { useAuthContext } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar/Sidebar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from './muiImports';
import Chat from '@/components/Chat/Chat';
import GeminiBotChatView from '@/components/Sidebar/ChatList/GeminiBot/GeminiBotChatView';
import { useAppContext } from '@/components/AppProvider';
import { AppProvider } from '@/components/AppProvider';
import { SnackbarProvider, useSnackbar, SnackbarKey } from 'notistack';
import { IconButton } from '@/app/muiImports';
import CloseIcon from '@mui/icons-material/Close';

// Close button component for snackbars
const SnackbarCloseButton = ({ snackbarId }: { snackbarId: SnackbarKey }) => {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton
      size='small'
      onClick={() => closeSnackbar(snackbarId)}
      sx={{ color: 'inherit' }}
    >
      <CloseIcon fontSize='small' />
    </IconButton>
  );
};
import { useRecentMessages } from '@/hooks/useRecentMessages';

// Renders GeminiBotChatView if Gemini-bot is selected, otherwise normal Chat
const MainChatSwitcher = () => {
  const { selectedChat } = useAppContext();
  const { user } = useAuthContext();
  if (selectedChat === 'gemini-bot' && user?.uid) {
    return <GeminiBotChatView userId={user.uid} />;
  }
  return <Chat />;
};

const Home = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  useRecentMessages(user?.uid); // Set up global chat listener for real-time updates across all chats

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
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

  if (!user) return null;

  return (
    <Box display='flex' height='100vh'>
      <SnackbarProvider
        maxSnack={5}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={5000}
        action={(snackbarId) => <SnackbarCloseButton snackbarId={snackbarId} />}
      >
        <AppProvider>
          <Sidebar />
          <MainChatSwitcher />
        </AppProvider>
      </SnackbarProvider>
    </Box>
  );
};

export default Home;
