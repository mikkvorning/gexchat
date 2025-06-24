import {
  Box,
  Paper,
  TextField,
  Typography,
  IconButton,
} from '../../app/muiImports';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChat, getChatMessages, sendMessage } from '../../lib/chatService';
import { useAuth } from '../AuthProvider';
import { useAppContext } from '../AppProvider';
import SendIcon from '@mui/icons-material/Send';

const Chat = () => {
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const { user } = useAuth();
  const { selectedChat } = useAppContext();
  const queryClient = useQueryClient();

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({
      chatId,
      senderId,
      content,
    }: {
      chatId: string;
      senderId: string;
      content: string;
    }) => sendMessage(chatId, senderId, content),
    onSuccess: () => {
      // Invalidate and refetch messages
      queryClient.invalidateQueries({
        queryKey: ['chatMessages', selectedChat],
      });
      // Clear input
      setMessageText('');
      // Refocus input
      messageInputRef.current?.focus();
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });

  // Handle sending message
  const handleSendMessage = async () => {
    if (
      !selectedChat ||
      !user?.uid ||
      !messageText.trim() ||
      sendMessageMutation.isPending
    ) {
      return;
    }

    sendMessageMutation.mutate({
      chatId: selectedChat,
      senderId: user.uid,
      content: messageText.trim(),
    });
  };

  // Handle Enter key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  // Get chat data
  const {
    data: chat,
    isLoading: chatLoading,
    error: chatError,
  } = useQuery({
    queryKey: ['chat', selectedChat],
    queryFn: () => getChat(selectedChat!),
    enabled: !!selectedChat,
  });
  // Get chat messages
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useQuery({
    queryKey: ['chatMessages', selectedChat],
    queryFn: () => getChatMessages(selectedChat!),
    enabled: !!selectedChat,
  });

  // Focus the message input when a chat is selected
  useEffect(() => {
    if (selectedChat && messageInputRef.current) {
      // Small delay to ensure the UI has rendered
      const timeoutId = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedChat]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  if (chatLoading || messagesLoading) {
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

  if (chatError || messagesError || !chat) {
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
  const otherParticipant = chat.participants.find(
    (p) => p.userId !== user?.uid
  );

  // Fallback to username or 'Unknown User' if not found
  const displayName = otherParticipant?.username || 'Unknown User';

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
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant='h6'>{displayName}</Typography>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ marginLeft: 'auto' }}
        >
          online
        </Typography>
      </Box>
      {/* Chat messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {' '}
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems:
                message.senderId === user?.uid ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                bgcolor:
                  message.senderId === user?.uid ? 'primary.main' : 'grey.800',
                color:
                  message.senderId === user?.uid
                    ? 'primary.contrastText'
                    : 'text.primary',
                p: 2,
                borderRadius: 2,
                maxWidth: '70%',
              }}
            >
              <Typography variant='body1'>{message.content}</Typography>
            </Box>
            <Typography variant='caption' color='text.secondary' m={1}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </Typography>
          </Box>
        ))}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </Box>
      {/* Chat input */}
      <Paper
        sx={{
          borderRadius: 0,
          p: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <TextField
            inputRef={messageInputRef}
            variant='outlined'
            placeholder='Type a message...'
            fullWidth
            multiline
            maxRows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMessageMutation.isPending}
          />
          <IconButton
            size='large'
            color='primary'
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            sx={{ mb: 0.5 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default Chat;
