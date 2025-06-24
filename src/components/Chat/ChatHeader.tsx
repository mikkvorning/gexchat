import { Box, Typography } from '../../app/muiImports';

interface ChatHeaderProps {
  displayName: string;
}

const ChatHeader = ({ displayName }: ChatHeaderProps) => {
  return (
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
  );
};

export default ChatHeader;
