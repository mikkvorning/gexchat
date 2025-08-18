import React from 'react';
import { Box, Paper, TextField, IconButton } from '../../../../app/muiImports';
import SendIcon from '@mui/icons-material/Send';

interface GeminiBotInputProps {
  isLoading: boolean;
  onSend: (content: string) => void | Promise<void>;
}

const GeminiBotInput: React.FC<GeminiBotInputProps> = ({
  isLoading,
  onSend,
}) => {
  const [messageText, setMessageText] = React.useState('');
  const messageInputRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!messageText.trim() || isLoading) return;
    const content = messageText.trim();
    setMessageText('');
    await onSend(content);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper sx={{ borderRadius: 0, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <TextField
          inputProps={{ ref: messageInputRef }}
          variant='outlined'
          placeholder='Type a message...'
          fullWidth
          multiline
          maxRows={4}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <IconButton
          size='large'
          color='primary'
          onClick={handleSend}
          disabled={!messageText.trim() || isLoading}
          sx={{ mb: 0.5 }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default GeminiBotInput;
