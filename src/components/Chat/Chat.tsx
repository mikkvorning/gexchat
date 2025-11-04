import CenterContent from '@/utils/CenterContent';
import { Box, Typography } from '../../app/muiImports';
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

const Chat = () => {
  const { user } = useAuthContext();
  const { selectedChat } = useAppContext();
  const { chat, messages, isLoading, error } = useChat(selectedChat);
  const {
    showError,
    failedMessage,
    truncateMessage,
    handleError,
    handleClose,
    handleRetry,
  } = useMessageError();

  if (!selectedChat) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant='h6' color='secondary'>
          Select a chat to start chatting
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant='h6' color='secondary'>
          Loading chat...
        </Typography>
      </Box>
    );
  }

  if (error || !chat) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant='h6' color='secondary'>
          Chat not found
        </Typography>
      </Box>
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

  const rejectingUsers = chat.participants.filter(
    (p) => p.acceptStatus === 'REJECTED'
  );

  if (chatAcceptStatus === 'REJECTED') {
    return (
      <CenterContent>
        <Typography variant='h6' color='primary'>
          {rejectingUsers.map((p) => p.displayName).join(', ')} has rejected the
          chat.
        </Typography>
      </CenterContent>
    );
  }

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
      {chatAcceptStatus === 'PENDING' && (
        <CenterContent sx={{ alignItems: 'flex-start' }}>
          <Typography variant='h6' color='primary'>
            Waiting for {chat.participants.map((p) => p.displayName).join(', ')}{' '}
            to accept the chat.
          </Typography>
        </CenterContent>
      )}
      <ErrorRibbon
        isVisible={showError}
        failedMessage={failedMessage}
        onRetry={handleRetry}
        onClose={handleClose}
        truncateMessage={truncateMessage}
      />
      {/* Only show ChatInput if chat is accepted or if currently typing initial greeting message */}
      {chatAcceptStatus === 'ACCEPTED' ||
        (chatAcceptStatus === 'PENDING' && messages.length === 0 && (
          <ChatInput
            chatId={selectedChat}
            userId={user?.uid}
            onSendError={handleError}
          />
        ))}
    </Box>
  );
};

export default Chat;
