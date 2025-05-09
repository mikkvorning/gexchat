import { Box, Paper, Typography } from '@mui/material';
import ChatInput from './ChatInput';

const ChatHistory = () => {
  return (
    <Paper
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        padding: 2,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1,
        flexGrow: 1,
      })}
    >
      <Box display='flex' flexGrow={1}>
        <Typography variant='h3' color='primary'>
          Chat History
        </Typography>
      </Box>
      {/* Add your chat history UI here */}

      <ChatInput />
    </Paper>
  );
};

export default ChatHistory;
