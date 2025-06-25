import { Box, Typography } from '../../app/muiImports';
import { useAuth } from '../AuthProvider';
import { useAppContext } from '../AppProvider';
import { useChat, useChatEffects } from './hooks';
import { getChatDisplayName } from './utils';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const Chat = () => {
  const { user } = useAuth();
  const { selectedChat } = useAppContext();

  // Custom hooks for chat functionality
  const { chat, messages, isLoading, error } = useChat(selectedChat);
  const { messagesEndRef } = useChatEffects({
    selectedChat,
    messages,
    messageInputRef: { current: null }, // We'll handle this in ChatInput now
  });

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

  // Get other participant for display name (for direct chats)
  const displayName = getChatDisplayName(chat, user?.uid);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      {/* Chat header */}
      <ChatHeader displayName={displayName} />

      {/* Chat messages */}
      <ChatMessages
        messages={messages}
        currentUserId={user?.uid}
        messagesEndRef={messagesEndRef}
      />

      {/* Chat input */}
      <ChatInput chatId={selectedChat} userId={user?.uid} />
    </Box>
  );
};

export default Chat;
