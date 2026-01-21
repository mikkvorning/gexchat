'use client';

import { useState } from 'react';
import { Box, Button, Link, Typography } from '../muiImports';
import { formConfigs, validationSchemas, FormValues } from './formConfig';
import { useAuth } from './useAuth';
import { useRouter } from 'next/navigation';
import { AuthForm } from './AuthForm';

type LoginFormState = 'login' | 'guest';

const Login = () => {
  const router = useRouter();
  const [formState, setFormState] = useState<LoginFormState>('login');

  // Destructure React Query state
  const { mutate, isPending, error } = useAuth();

  const handleSubmit = (values: FormValues) => {
    mutate({
      authType: formState,
      email: values.email,
      password: values.password,
      nickname: values.nickname,
    });
  };
  return (
    <AuthForm
      title={formConfigs[formState].title}
      subtitle={formConfigs[formState].subtitle}
      fields={formConfigs[formState].fields}
      validationSchema={validationSchemas[formState]}
      submitButton={formConfigs[formState].submitButton}
      submitButtonLoading={formConfigs[formState].submitButtonLoading}
      onSubmit={handleSubmit}
      isPending={isPending}
      error={error}
      formKey={formState}
      additionalButtons={
        <>
          {formState === 'login' && (
            <Button
              variant='outlined'
              fullWidth
              onClick={() => setFormState('guest')}
              disabled={isPending}
            >
              Continue as Guest
            </Button>
          )}

          {formState === 'guest' && (
            <Button
              variant='outlined'
              fullWidth
              onClick={() => setFormState('login')}
              disabled={isPending}
              sx={{ mt: 1 }}
            >
              Back to Login
            </Button>
          )}
        </>
      }
      bottomSection={
        <Box mt={4} textAlign='center'>
          <Typography color='text.secondary'>
            {"Don't have an account?"}
            <Link
              component='button'
              onClick={() => router.push('/login/signup')}
              sx={{
                color: 'primary.main',
                textDecoration: 'underline',
                cursor: 'pointer',
                mx: 1,
                position: 'relative',
                top: -2,
              }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      }
    />
  );
};

export default Login;
