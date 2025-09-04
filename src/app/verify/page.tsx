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
import { useLogout } from '@/hooks/useLogout';

const VerifyPage = () => {
  const router = useRouter();
  const { mutate: logout } = useLogout();
  const [formError, setFormError] = useState<string | undefined>();
  const [isResending, setIsResending] = useState(false);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Since we're using httpOnly cookies, we need to check via API
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/verify-session');
        const data = await response.json();

        if (response.ok && data.user) {
          if (data.user.emailVerified) {
            router.replace('/');
          } else {
            setChecked(true);
          }
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    };

    // Get email from localStorage (set during login)
    let userEmail = null;
    try {
      userEmail = localStorage.getItem('lastLoginEmail');
    } catch {}
    setEmail(userEmail);

    checkSession();
  }, [router]);

  const handleResendVerification = async () => {
    setIsResending(true);

    try {
      // Step 1: Server-side validation via API
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Session invalid, redirect to login
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch {}
          try {
            localStorage.removeItem('lastLoginEmail');
          } catch {}
          router.replace('/login');
          return;
        } else if (response.status === 400) {
          setFormError('Email is already verified.');
          return;
        } else {
          throw new Error(data.error || 'Server validation failed');
        }
      }

      // Step 2: Synchronization check between server and client auth states
      const serverUser = data.user;

      // Check if client-side auth state exists
      if (!auth.currentUser) {
        setFormError('Please log in again to resend verification email.');

        // Clean up and redirect after a delay so user can read the message
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
        return;
      }

      // Step 3: Verify synchronization between server and client states
      if (auth.currentUser.uid !== serverUser.uid) {
        setFormError('Authentication state mismatch. Please log in again.');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
        return;
      }

      if (auth.currentUser.email !== serverUser.email) {
        setFormError('Authentication state mismatch. Please log in again.');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
        return;
      }

      // Step 4: States are synchronized, use Firebase client to send verification email
      await sendEmailVerification(auth.currentUser);

      setFormError(
        'Verification email resent. Please check your inbox and spam folder.'
      );
    } catch (err) {
      const error = err as { code?: string; message?: string };

      // Handle specific Firebase errors
      if (error.code === 'auth/too-many-requests') {
        setFormError(
          'Please wait a few minutes before requesting another verification email.'
        );
      } else if (error.code === 'auth/network-request-failed') {
        setFormError(
          'Network error. Please check your connection and try again.'
        );
      } else {
        setFormError(
          error.message ||
            'Failed to resend verification email. Please try again later.'
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  if (!checked) {
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
            onClick={() => {
              logout(); // This will handle logout and redirect to login
            }}
          >
            Back to Login
          </Button>
          <Button
            variant='text'
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
