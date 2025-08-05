import { Box, Link, Paper, Typography, CircularProgress } from '@mui/material';
import { UserCredential, sendEmailVerification } from 'firebase/auth';
import { useState } from 'react';

interface EmailVerificationProps {
  email: string;
  userCredential?: UserCredential;
  onBackToLogin: () => void;
}

const EmailVerification = ({
  email,
  userCredential,
  onBackToLogin,
}: EmailVerificationProps) => {
  const [formError, setFormError] = useState<string | undefined>();
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    if (!email || !userCredential?.user) return;

    setIsResending(true);
    try {
      await sendEmailVerification(userCredential.user);
      setFormError(
        'Verification email resent. Please check your inbox and spam folder.'
      );
    } catch (err) {
      const error = err as { code?: string };
      console.error('Error resending verification:', error);

      if (error.code === 'auth/too-many-requests') {
        setFormError(
          'Please wait a few minutes before requesting another verification email.'
        );
      } else {
        setFormError(
          'Failed to resend verification email. Please try again later.'
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Box
      display='flex'
      minHeight='100vh'
      alignItems='center'
      justifyContent='center'
      bgcolor='background.default'
    >
      <Paper
        elevation={3}
        sx={{ width: '100%', maxWidth: 400, p: 4, borderRadius: 3 }}
      >
        <Box textAlign='center' mb={4}>
          <Typography variant='h5' fontWeight='bold' mb={2} color='primary'>
            Check Your Email
          </Typography>
          <Typography variant='body1' mb={3}>
            A verification link has been sent to:
            <br />
            <strong>{email}</strong>
          </Typography>
          <Typography variant='body2' color='text.secondary' mb={3}>
            Please check your email and click the verification link to activate
            your account. If you don&apos;t see the email:
          </Typography>
          <Box component='ul' sx={{ textAlign: 'left', mb: 3 }}>
            <Typography component='li' variant='body2' color='text.secondary'>
              Check your spam/junk folder
            </Typography>
            <Typography component='li' variant='body2' color='text.secondary'>
              Make sure you entered your email correctly
            </Typography>
            <Typography component='li' variant='body2' color='text.secondary'>
              Wait a few minutes and check again
            </Typography>
          </Box>
          <Box mb={3}>
            <Box
              display='flex'
              alignItems='center'
              justifyContent='center'
              gap={1}
            >
              <Link
                component='button'
                onClick={handleResendVerification}
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                  opacity: isResending ? 0.5 : 1,
                  pointerEvents: isResending ? 'none' : 'auto',
                }}
                disabled={isResending}
              >
                Resend Verification Email
              </Link>
              {isResending && <CircularProgress size={16} />}
            </Box>
          </Box>
          {formError && (
            <Typography
              color={
                formError.includes('resent') ? 'success.main' : 'error.main'
              }
              variant='body2'
              mb={2}
            >
              {formError}
            </Typography>
          )}
          <Box>
            <Link
              component='button'
              onClick={onBackToLogin}
              sx={{ color: 'primary.main', textDecoration: 'underline' }}
            >
              Back to Login
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmailVerification;
