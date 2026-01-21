'use client';

import { Box, Link, Typography } from '../../muiImports';
import { formConfigs, validationSchemas, FormValues } from '../formConfig';
import { useAuth } from '../useAuth';
import { useRouter } from 'next/navigation';
import { AuthForm } from '../AuthForm';

const Signup = () => {
  const router = useRouter();

  // Destructure React Query state
  const { mutate, isPending, error } = useAuth();

  const handleSubmit = (values: FormValues) => {
    mutate({
      authType: 'signup',
      email: values.email,
      password: values.password,
      nickname: values.nickname,
    });
  };

  return (
    <AuthForm
      title={formConfigs.signup.title}
      subtitle={formConfigs.signup.subtitle}
      fields={formConfigs.signup.fields}
      validationSchema={validationSchemas.signup}
      submitButton={formConfigs.signup.submitButton}
      submitButtonLoading={formConfigs.signup.submitButtonLoading}
      onSubmit={handleSubmit}
      isPending={isPending}
      error={error}
      bottomSection={
        <Box mt={4} textAlign='center'>
          <Typography color='text.secondary'>
            Already have an account?
            <Link
              component='button'
              onClick={() => router.push('/login')}
              sx={{
                color: 'primary.main',
                textDecoration: 'underline',
                cursor: 'pointer',
                mx: 1,
                position: 'relative',
                top: -2,
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      }
    />
  );
};

export default Signup;
