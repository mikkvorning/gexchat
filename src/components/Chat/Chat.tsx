import { Box, Typography } from '../../app/muiImports';
import { useAuthContext } from '../AuthProvider';
import { useAppContext } from '../AppProvider';
import { useChat } from './hooks/useChat';
import { useChatEffects } from './hooks/useChatEffects';
import { useMessageError } from './hooks/useMessageError';
import { getChatDisplayName } from './utils/chatUtils';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ErrorRibbon from './ErrorRibbon';

const Chat = () => {
  const { user } = useAuthContext();
  const { selectedChat } = useAppContext();
  const { chat, messages, isLoading, error } = useChat(selectedChat);
  const { messagesEndRef } = useChatEffects({
    selectedChat,
    messages,
    messageInputRef: { current: null },
  });
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
        <Typography variant='h6' color='text.secondary'>
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
        <Typography variant='h6' color='text.secondary'>
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
        <Typography variant='h6' color='text.secondary'>
          Chat not found
        </Typography>
      </Box>
    );
  }

  const displayName = getChatDisplayName(chat!, user?.uid);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <ChatHeader displayName={displayName} />
      <ChatMessages
        messages={messages}
        currentUserId={user?.uid}
        messagesEndRef={messagesEndRef}
      />
      <ErrorRibbon
        isVisible={showError}
        failedMessage={failedMessage}
        onRetry={handleRetry}
        onClose={handleClose}
        truncateMessage={truncateMessage}
      />
      <ChatInput
        chatId={selectedChat}
        userId={user?.uid}
        onSendError={handleError}
      />
    </Box>
  );
};

export default Chat;
