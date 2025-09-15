'use client';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  CardHeader,
} from '@mui/material';
import { useLogout } from '@/hooks/useLogout';
import { useEmailVerification } from './useEmailVerification';
import { useResendVerification } from './useResendVerification';
import { getErrorMessage } from '@/utils/errorMessages';

const VerifyPage = () => {
  const { mutate: logout } = useLogout();

  const { isLoading, email, isVerificationPending } = useEmailVerification();
  const {
    mutate: resendVerification,
    isPending: isResending,
    error: resendError,
    data: successMessage,
  } = useResendVerification();

  if (isLoading || !isVerificationPending) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: 2,
        }}
      >
        <CardHeader
          title={
            <Typography variant='h5' color='primary'>
              Check Your Email
            </Typography>
          }
        />
        <CardContent sx={{ flexDirection: 'column', display: 'flex', gap: 2 }}>
          <Typography>
            A verification link has been sent to:
            <br />
            <strong>{email || 'your email'}</strong>
          </Typography>
          <Typography>
            Please check your email and click the verification link to activate
            your account. If you don&apos;t see the email:
          </Typography>

          <List
            dense
            sx={{
              listStyleType: 'disc',
              '.MuiListItemText-root': { display: 'list-item', my: 0 },
            }}
          >
            <ListItem>
              <ListItemText primary='Check your spam/junk folder' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Make sure you entered your email correctly' />
            </ListItem>
            <ListItem>
              <ListItemText primary='Wait a few minutes and check again' />
            </ListItem>
          </List>
          {(resendError || successMessage) && (
            <Typography
              variant='body2'
              color={successMessage ? 'success.main' : 'error.main'}
            >
              {successMessage || getErrorMessage(resendError as Error)}
            </Typography>
          )}
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-around', py: 3 }}>
          <Button
            variant='outlined'
            onClick={() => {
              logout(); // This will handle logout and redirect to login
            }}
          >
            Back to Login
          </Button>
          <Button
            variant='text'
            onClick={() => resendVerification()}
            disabled={isResending}
          >
            Resend Verification Email
          </Button>
          {isResending && <CircularProgress size={16} />}
        </CardActions>
      </Card>
    </Box>
  );
};

export default VerifyPage;
