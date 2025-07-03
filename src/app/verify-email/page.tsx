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
        setErrorMessage('Invalid verification link.');
        return;
      }

      try {
        await applyActionCode(auth, actionCode);
        setVerificationStatus('success');

        // Reload the user to update emailVerified status
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
      } catch (error: unknown) {
        setVerificationStatus('error');
        if (error && typeof error === 'object' && 'code' in error) {
          const firebaseError = error as { code: string; message: string };
          switch (firebaseError.code) {
            case 'auth/expired-action-code':
              setErrorMessage(
                'This verification link has expired. Please request a new one.'
              );
              break;
            case 'auth/invalid-action-code':
              setErrorMessage(
                'This verification link is invalid or has already been used.'
              );
              break;
            default:
              setErrorMessage('Failed to verify email. Please try again.');
          }
        } else {
          setErrorMessage('Failed to verify email. Please try again.');
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
