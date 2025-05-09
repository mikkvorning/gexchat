import { TextField } from '@mui/material';

const ChatInput = () => {
  return (
    <TextField
      type='text'
      label='Type a message'
      variant='outlined'
      fullWidth
    />
  );
};

export default ChatInput;
