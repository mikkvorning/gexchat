import { Box, Paper, TextField, IconButton } from '../../app/muiImports';
import SendIcon from '@mui/icons-material/Send';
import { useMessaging } from './hooks/useMessaging';
import { useEffect } from 'react';

interface ChatInputProps {
  chatId: string | null;
  userId: string | undefined;
  onSendError?: (message: string) => void;
  geminiBotSendFn?: (content: string) => Promise<void>;
  isLoading?: boolean; // Additional loading state for external processes
}

const ChatInput = ({
  chatId,
  userId,
  onSendError,
  geminiBotSendFn,
  isLoading = false,
}: ChatInputProps) => {
  const {
    messageText,
    messageInputRef,
    sendMessageMutation,
    handleSendMessage,
    handleKeyPress,
    handleTextChange,
    handleStopTyping,
  } = useMessaging({
    chatId,
    userId,
    onError: onSendError,
    geminiBotSendFn,
    // onMessageSent is handled internally in useMessaging
  });

  useEffect(() => {
    // Cleanup: stop typing when component unmounts
    return () => {
      handleStopTyping();
    };
  }, [handleStopTyping]);

  return (
    <Paper
      sx={{
        borderRadius: 0,
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <TextField
          slotProps={{ input: { ref: messageInputRef } }}
          variant='outlined'
          placeholder='Type a message...'
          fullWidth
          multiline
          maxRows={4}
          value={messageText}
          onChange={(e) => {
            handleTextChange(e.target.value);
          }}
          onKeyPress={handleKeyPress}
          onBlur={handleStopTyping} // Stop typing when user leaves the input
        />
        <IconButton
          size='large'
          color='primary'
          onClick={handleSendMessage}
          disabled={
            !messageText.trim() || sendMessageMutation.isPending || isLoading
          }
          sx={{ mb: 0.5 }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatInput;
