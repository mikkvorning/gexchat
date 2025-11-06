import CenterContent from '@/utils/CenterContent';
import { Box, Button, Typography } from '../../app/muiImports';
import { useAppContext } from '../AppProvider';
import { useAuthContext } from '../AuthProvider';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import ErrorRibbon from './ErrorRibbon';
import { useChat } from './hooks/useChat';
import { useMessageError } from './hooks/useMessageError';
import { getChatDisplayName } from './utils/chatUtils';
import { AcceptStatus } from '@/types/types';
import { Grid } from '@mui/material';
import { useHandleChatInvitation } from '@/hooks/useHandleChatInvitation';
import { useEffect } from 'react';
import { enqueueSnackbar } from 'notistack';

const Chat = () => {
  const { user } = useAuthContext();
  const { selectedChat } = useAppContext();
  const { chat, messages, isLoading, error } = useChat(selectedChat);
  const {
    acceptChat,
    rejectChat,
    isPending,
    error: handleInviteError,
  } = useHandleChatInvitation();
  const {
    showError,
    failedMessage,
    truncateMessage,
    handleError,
    handleClose,
    handleRetry,
  } = useMessageError();

  useEffect(() => {
    if (handleInviteError) {
      enqueueSnackbar('Failed to accept/reject chat. Please try again.', {
        variant: 'error',
      });
    }
  }, [handleInviteError]);

  if (!selectedChat) {
    return (
      <CenterContent>
        <Typography variant='h6' color='secondary'>
          Select a chat to start chatting
        </Typography>
      </CenterContent>
    );
  }

  if (isLoading) {
    return (
      <CenterContent>
        <Typography variant='h6' color='secondary'>
          Loading chat...
        </Typography>
      </CenterContent>
    );
  }

  if (error || !chat) {
    return (
      <CenterContent>
        <Typography variant='h6' color='secondary'>
          Chat not found
        </Typography>
      </CenterContent>
    );
  }

  const displayName = getChatDisplayName(chat!, user?.uid);
  const chatAcceptStatus: AcceptStatus = chat.participants.every(
    (p) => p.acceptStatus === 'ACCEPTED'
  )
    ? 'ACCEPTED'
    : chat.participants.some((p) => p.acceptStatus === 'PENDING')
    ? 'PENDING'
    : 'REJECTED';

  const isInitialMessage =
    chatAcceptStatus === 'PENDING' && messages.length === 0;

  const rejectingUsers = chat.participants.filter(
    (p) => p.acceptStatus === 'REJECTED'
  );
  // Determine if the current user is being invited
  const isInvite =
    chat.participants.find((p) => p.userId === user?.uid)?.acceptStatus ===
    'PENDING';

  if (chatAcceptStatus === 'REJECTED') {
    return (
      <CenterContent>
        <Typography variant='h6' color='primary'>
          {rejectingUsers.find((p) => p.userId === user?.uid)
            ? 'You have rejected the chat.'
            : rejectingUsers.map((p) => p.displayName).join(', ') +
              ' has rejected the chat.'}
        </Typography>
      </CenterContent>
    );
  }

  // Displays pending chat invitation message or buttons to accept/reject
  const ChatPending = () => {
    return chatAcceptStatus === 'PENDING' ? (
      <CenterContent sx={{ alignItems: 'flex-start' }}>
        <Typography variant='h6' color='primary' align='center'>
          {isInvite ? (
            <Grid container sx={{ flexDirection: 'column', gap: 2 }}>
              {chat.participants
                .filter((p) => p.acceptStatus === 'ACCEPTED')
                .map((p) => p.displayName)
                .join(', ')}
              &nbsp;wants to start a chat.
              <Grid container spacing={2} justifyContent={'center'}>
                <Button
                  variant='contained'
                  onClick={() => acceptChat(chat.id, user!.uid)}
                  disabled={isPending}
                >
                  Accept
                </Button>
                <Button
                  variant='outlined'
                  onClick={() => rejectChat(chat.id, user!.uid)}
                  disabled={isPending}
                >
                  Reject
                </Button>
              </Grid>
            </Grid>
          ) : (
            `Waiting for ${chat.participants
              .filter((p) => p.acceptStatus === 'PENDING')
              .map((p) => p.displayName)
              .join(', ')} to accept the chat invitation.`
          )}
        </Typography>
      </CenterContent>
    ) : null;
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ChatHeader displayName={displayName} />
      <ChatMessages messages={messages} currentUserId={user?.uid} chat={chat} />
      <ChatPending />
      <ErrorRibbon
        isVisible={showError}
        failedMessage={failedMessage}
        onRetry={handleRetry}
        onClose={handleClose}
        truncateMessage={truncateMessage}
      />
      {/* Only show ChatInput if chat is accepted or if currently typing initial greeting message */}
      {(chatAcceptStatus === 'ACCEPTED' || isInitialMessage) && (
        <ChatInput
          chatId={selectedChat}
          userId={user?.uid}
          onSendError={handleError}
        />
      )}
    </Box>
  );
};

export default Chat;
