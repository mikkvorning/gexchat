'use client';

import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Formik, FormikHelpers } from 'formik';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Box, Button, Link, Paper, Typography } from '../muiImports';
import { FormField } from './FormField';
import {
  formFields,
  loginSchema,
  signupSchema,
  getInitialValues,
  FormValues,
} from './loginFormConfig';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

const Login = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const formikRef = useRef<FormikHelpers<FormValues>>(null);
  const initialValues = getInitialValues();

  const handleFormSwitch = () => {
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    setIsSignup(!isSignup);
  };

  // Removed EmailVerification state
  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, setErrors }: FormikHelpers<FormValues>
  ) => {
    try {
      setErrors({ authError: undefined });

      // Call the secure API route
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          isSignup: isSignup,
          nickname: values.nickname,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      const user = data.user;
      setUser(user);

      if (isSignup) {
        // For signup, store email and redirect to verify page
        localStorage.setItem('lastLoginEmail', values.email);
        router.replace('/verify');
        setSubmitting(false);
        return;
      }

      if (!user.emailVerified) {
        // Store email for /verify page
        localStorage.setItem('lastLoginEmail', values.email);
        router.replace('/verify');
        setSubmitting(false);
        return;
      }

      // For verified users, establish client-side Firebase auth for Firestore access
      // This is secure because:
      // 1. Server already validated credentials
      // 2. Only happens for email-verified users
      // 3. Uses the same credentials that were server-validated
      try {
        await signInWithEmailAndPassword(auth, values.email, values.password);

        // Force token refresh to ensure latest email_verified claim
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
      } catch {
        // Continue anyway since server-side auth succeeded
        // User will still be logged in via cookies
      }

      router.replace('/');
    } catch (error: unknown) {
      let errorMessage = 'Something went wrong. Please try again.';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        errorMessage = firebaseError.code;
      }

      setErrors({ authError: errorMessage });
    } finally {
      setSubmitting(false);
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
        <Box textAlign='center' mb={2}>
          <Typography variant='h5' fontWeight='bold' mb={1} color='primary'>
            {isSignup ? 'Create an Account' : 'Welcome to GexChat'}
          </Typography>

          {/* Some kinda casual tagline here */}
          <Typography variant='subtitle2' px={2}>
            {isSignup
              ? 'Now which name to use? Hmmm...'
              : "Let's see if you still remember your login!"}
          </Typography>
        </Box>

        <Formik
          key={isSignup ? 'signup' : 'signin'}
          initialValues={initialValues}
          validationSchema={isSignup ? signupSchema : loginSchema}
          validateOnBlur={true}
          innerRef={(formik) => {
            formikRef.current = formik;
          }}
          onSubmit={handleSubmit}
        >
          {({
            errors,
            touched,
            isSubmitting,
            handleChange,
            handleBlur,
            values,
            handleSubmit,
          }) => (
            <Box
              component='form'
              method='post'
              autoComplete='off'
              noValidate
              onSubmit={handleSubmit}
            >
              {formFields
                .filter((field) => {
                  // Show field if:
                  // - showOnSignup is undefined (shows on both)
                  // - showOnSignup is true and we're in signup mode
                  // - showOnSignup is false and we're in login mode
                  return (
                    field.showOnSignup === undefined ||
                    field.showOnSignup === isSignup
                  );
                })
                .map((field) => (
                  <FormField
                    key={field.name}
                    field={field}
                    values={values}
                    errors={errors}
                    touched={touched}
                    handleChange={handleChange}
                    handleBlur={handleBlur}
                    isSubmitting={isSubmitting}
                  />
                ))}

              <Button
                fullWidth
                type='submit'
                variant='contained'
                color='primary'
                disabled={isSubmitting}
                sx={{ mt: 2 }}
              >
                {isSubmitting
                  ? isSignup
                    ? 'Signing up...'
                    : 'Signing in...'
                  : isSignup
                  ? 'Sign up'
                  : 'Sign in'}
              </Button>

              {errors.authError && (
                <Box my={2} textAlign='center'>
                  <Typography color='error' variant='body2'>
                    {getFirebaseErrorMessage(errors.authError)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Formik>
        <Box mt={4} textAlign='center'>
          <Typography color='text.secondary'>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
            <Link
              component='button'
              onClick={handleFormSwitch}
              sx={{
                color: 'primary.main',
                textDecoration: 'underline',
                cursor: 'pointer',
                mx: 1,
                position: 'relative',
                top: -2,
              }}
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
