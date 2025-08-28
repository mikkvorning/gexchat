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
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

const VerifyPage = () => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | undefined>();
  const [isResending, setIsResending] = useState(false);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get user info from cookies
    const session = getCookie('session');
    const emailVerified = getCookie('emailVerified');

    // Get email from localStorage (set during login)
    let userEmail = null;
    try {
      userEmail = localStorage.getItem('lastLoginEmail');
    } catch {}
    setEmail(userEmail);

    // Only redirect if we've checked and conditions are not met
    if (!session || emailVerified !== 'false') {
      // Clear any stale data and redirect
      try {
        localStorage.removeItem('lastLoginEmail');
      } catch {}
      router.replace('/login');
    } else {
      setChecked(true);
    }
  }, [router]);

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      // Firebase Auth user is lost, clear cookies and redirect to login
      document.cookie =
        'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie =
        'emailVerified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      try {
        localStorage.removeItem('lastLoginEmail');
      } catch {}
      router.replace('/login');
      return;
    }

    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setFormError(
        'Verification email resent. Please check your inbox and spam folder.'
      );
    } catch (err) {
      const error = err as { code?: string };
      console.error('Error resending verification:', error);

      setFormError(
        error.code === 'auth/too-many-requests'
          ? 'Please wait a few minutes before requesting another verification email.'
          : 'Failed to resend verification email. Please try again later.'
      );
    } finally {
      setIsResending(false);
    }
  };

  if (!checked) return null;

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
          {formError && (
            <Typography
              variant='body2'
              color={
                formError.includes('resent') ? 'success.main' : 'error.main'
              }
            >
              {formError}
            </Typography>
          )}
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-around', py: 3 }}>
          <Button
            variant='outlined'
            size='small'
            onClick={() => {
              router.push('/logout');
            }}
          >
            Back to Login
          </Button>
          <Button
            variant='text'
            size='small'
            onClick={handleResendVerification}
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
