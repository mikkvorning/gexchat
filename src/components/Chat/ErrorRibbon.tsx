import { Box, Typography, IconButton, Button } from '../../app/muiImports';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';

interface ErrorRibbonProps {
  isVisible: boolean;
  failedMessage: string;
  onRetry: () => void;
  onClose: () => void;
  truncateMessage: (message: string) => string;
}

const ErrorRibbon = ({
  isVisible,
  failedMessage,
  onRetry,
  onClose,
  truncateMessage,
}: ErrorRibbonProps) => {
  if (!isVisible) return null;

  return (
    <Box
      sx={{
        backgroundColor: 'error.main',
        color: 'error.contrastText',
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 48,
        borderTop: '1px solid',
        borderColor: 'error.dark',
      }}
    >
      <ErrorIcon fontSize='small' />
      <Typography variant='body2' sx={{ flex: 1 }}>
        Failed to send &ldquo;{truncateMessage(failedMessage)}&rdquo;
      </Typography>
      <Button
        variant='outlined'
        size='small'
        onClick={onRetry}
        sx={{
          color: 'inherit',
          borderColor: 'currentColor',
          '&:hover': {
            borderColor: 'currentColor',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        Resend
      </Button>
      <IconButton
        size='small'
        onClick={onClose}
        sx={{
          color: 'inherit',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <CloseIcon fontSize='small' />
      </IconButton>
    </Box>
  );
};

export default ErrorRibbon;
