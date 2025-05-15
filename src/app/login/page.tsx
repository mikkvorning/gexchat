'use client';

import { useAuth } from '@/components/AuthProvider';
import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Formik, FormikHelpers } from 'formik';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import * as Yup from 'yup';
import { Box, Button, Link, Paper, TextField, Typography } from '../muiImports';

interface FormValues {
  email: string;
  password: string;
  confirmPassword?: string;
  nickname?: string;
}

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
});

const signupSchema = loginSchema.shape({
  confirmPassword: Yup.string().oneOf(
    [Yup.ref('password')],
    'Passwords must match'
  ),
  nickname: Yup.string()
    .required('Nickname is required')
    .max(30, 'Nickname may not exceed 30 characters'),
});

const Login = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const formikRef = useRef<FormikHelpers<FormValues>>(null);
  const initialValues = {
    email: '',
    password: '',
    ...(isSignup ? { confirmPassword: '', nickname: '' } : {}),
  };

  const handleFormSwitch = () => {
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    setIsSignup(!isSignup);
  };

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, setErrors }: FormikHelpers<FormValues>
  ) => {
    try {
      let userCredential;
      if (isSignup) {
        // Create the user account first
        userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );

        const nickname = values.nickname || values.email.split('@')[0];

        // Update Firebase Auth profile
        await updateProfile(userCredential.user, {
          displayName: nickname,
        });

        // Save user data to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: values.email,
          nickname: nickname,
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          status: 'online',
        });
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
      } // Set the user in the auth context
      setUser(userCredential.user);

      // Set the session cookie properly with the user's ID
      document.cookie = `session=${userCredential.user.uid}; path=/;`;

      // Redirect to the home page using replace to prevent back navigation
      router.replace('/');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Authentication failed. Please try again.';
      setErrors({ email: errorMessage });
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
        <Box textAlign='center' mb={4}>
          <Typography variant='h4' fontWeight={700} mb={1} color='text.primary'>
            {isSignup ? 'Create an Account' : 'Welcome to GexChat'}
          </Typography>
          <Typography color='text.secondary'>
            Connect and chat with someone, somewhere. Maybe...
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
              onSubmit={handleSubmit}
            >
              {isSignup && (
                <Box mb={3}>
                  <TextField
                    fullWidth
                    id='nickname'
                    name='nickname'
                    label='Nickname'
                    value={values.nickname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.nickname && Boolean(errors.nickname)}
                    helperText={touched.nickname && errors.nickname}
                  />
                </Box>
              )}
              <Box mb={3}>
                <TextField
                  fullWidth
                  label='Email'
                  name='email'
                  type='email'
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  error={Boolean(errors.email && touched.email)}
                  helperText={touched.email && errors.email}
                  margin='normal'
                />
              </Box>
              <Box mb={3}>
                <TextField
                  fullWidth
                  label='Password'
                  name='password'
                  type='password'
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  error={Boolean(errors.password && touched.password)}
                  helperText={touched.password && errors.password}
                  margin='normal'
                />
              </Box>
              {isSignup && (
                <Box mb={3}>
                  <TextField
                    fullWidth
                    label='Confirm Password'
                    name='confirmPassword'
                    type='password'
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    error={Boolean(
                      errors.confirmPassword && touched.confirmPassword
                    )}
                    helperText={
                      touched.confirmPassword && errors.confirmPassword
                    }
                    margin='normal'
                  />
                </Box>
              )}
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
