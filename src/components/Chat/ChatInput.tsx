import { Box, Paper, TextField, IconButton } from '../../app/muiImports';
import SendIcon from '@mui/icons-material/Send';
import { useSendMessage } from './hooks/useSendMessage';

interface ChatInputProps {
  chatId: string | null;
  userId: string | undefined;
  onSendError?: (message: string) => void;
}

const ChatInput = ({ chatId, userId, onSendError }: ChatInputProps) => {
  const {
    messageText,
    setMessageText,
    messageInputRef,
    sendMessageMutation,
    handleSendMessage,
    handleKeyPress,
  } = useSendMessage({ chatId, userId, onError: onSendError });

  return (
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
  );
};

export default ChatInput;
