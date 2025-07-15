'use client';

import { auth } from '@/lib/firebase';
import { applyActionCode } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography } from '../muiImports';
import { Suspense } from 'react';

const VerifyEmailContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const actionCode = searchParams.get('oobCode');

      if (!actionCode) {
        setVerificationStatus('error');
        setErrorMessage(
          'Missing verification code. Please use the link from your verification email.'
        );
        return;
      }

      try {
        // First check if the user is already verified
        if (auth.currentUser?.emailVerified) {
          setVerificationStatus('success');
          return;
        }

        await applyActionCode(auth, actionCode);
        setVerificationStatus('success');

        // Reload the user to update emailVerified status
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
      } catch (error: unknown) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        if (error && typeof error === 'object' && 'code' in error) {
          const firebaseError = error as { code: string; message: string };
          switch (firebaseError.code) {
            case 'auth/expired-action-code':
              setErrorMessage(
                'This verification link has expired. Please request a new one from the login page.'
              );
              break;
            case 'auth/invalid-action-code':
              setErrorMessage(
                'This verification link is invalid or has already been used. Please request a new one from the login page.'
              );
              break;
            case 'auth/user-not-found':
              setErrorMessage(
                'Account not found. The account may have been deleted.'
              );
              break;
            case 'auth/invalid-email':
              setErrorMessage(
                'Invalid email address. Please check your verification link.'
              );
              break;
            default:
              setErrorMessage(
                'Something went wrong while verifying your email. Please try again or contact support if the problem continues.'
              );
          }
        } else {
          setErrorMessage(
            'Something went wrong while verifying your email. Please try again or contact support if the problem continues.'
          );
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleContinue = () => {
    router.push('/login');
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
        <Box textAlign='center'>
          {verificationStatus === 'loading' && (
            <>
              <Typography variant='h5' fontWeight='bold' mb={2} color='primary'>
                Verifying Email...
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Please wait while we verify your email address.
              </Typography>
            </>
          )}

          {verificationStatus === 'success' && (
            <>
              <Typography
                variant='h5'
                fontWeight='bold'
                mb={2}
                color='success.main'
              >
                Email Verified!
              </Typography>
              <Typography variant='body1' color='text.secondary' mb={3}>
                Your email has been successfully verified. You can now sign in
                to your account.
              </Typography>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                onClick={handleContinue}
              >
                Continue to Sign In
              </Button>
            </>
          )}

          {verificationStatus === 'error' && (
            <>
              <Typography variant='h5' fontWeight='bold' mb={2} color='error'>
                Verification Failed
              </Typography>
              <Typography variant='body1' color='text.secondary' mb={3}>
                {errorMessage}
              </Typography>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                onClick={handleContinue}
              >
                Back to Login
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

const VerifyEmail = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmail;
