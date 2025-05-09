import { Box } from '@mui/material';
import ChatHistory from './ChatHistory';

const Chat = () => {
  return (
    <Box
      display='flex'
      flexDirection='column'
      gap={2}
      flexGrow={1}
      width={'100%'}
    >
      <ChatHistory />
    </Box>
  );
};

export default Chat;
