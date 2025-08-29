'use client';

import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Formik, FormikHelpers, FormikErrors, FormikTouched } from 'formik';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import * as Yup from 'yup';
import { Box, Button, Link, Paper, TextField, Typography } from '../muiImports';
import { FormHelperText } from '@mui/material';

interface FormFieldConfig {
  name: keyof FormValues;
  label: string;
  type?: string;
  required?: boolean;
  showOnSignup?: boolean; // true = signup only, false = login only, undefined = both
}

const formFields: FormFieldConfig[] = [
  {
    name: 'nickname',
    label: 'Nickname',
    required: true,
    showOnSignup: true, // signup only
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    // shows on both (undefined)
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    required: true,
    // shows on both (undefined)
  },
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    required: true,
    showOnSignup: true, // signup only
  },
];

interface FormFieldProps {
  field: FormFieldConfig;
  values: FormValues;
  errors: FormikErrors<FormValues>;
  touched: FormikTouched<FormValues>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  isSubmitting: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  field,
  values,
  errors,
  touched,
  handleChange,
  handleBlur,
  isSubmitting,
}) => (
  <Box height={100}>
    <TextField
      fullWidth
      id={field.name}
      name={field.name}
      label={field.label}
      type={field.type || 'text'}
      value={values[field.name] || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={isSubmitting}
      error={touched[field.name] && Boolean(errors[field.name])}
      helperText={touched[field.name]}
      margin='normal'
    />
    {touched[field.name] && (
      <Box ml={2}>
        <FormHelperText>{errors[field.name]}</FormHelperText>
      </Box>
    )}
  </Box>
);

interface FormValues {
  email: string;
  password: string;
  confirmPassword?: string;
  nickname?: string;
  authError?: string;
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
  authError: Yup.string().optional(),
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

// Helper function to convert Firebase error codes to user-friendly messages
const getFirebaseErrorMessage = (errorMessage: string): string => {
  // Extract Firebase error code from messages like "Firebase: Error (auth/invalid-credential)."
  const firebaseCodeMatch = errorMessage.match(/auth\/[\w-]+/);
  const errorCode = firebaseCodeMatch ? firebaseCodeMatch[0] : errorMessage;

  // prettier-ignore
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address. Please check your email or sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
    'auth/operation-not-allowed': 'Email/password sign-in is currently disabled. Please contact support.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  };

  return (
    errorMessages[errorCode] ?? errorMessage // Return original message if no mapping found
  );
};

const Login = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const formikRef = useRef<FormikHelpers<FormValues>>(null);
  const initialValues: FormValues = {
    email: '',
    password: '',
    authError: undefined,
    ...(isSignup ? { confirmPassword: '', nickname: '' } : {}),
  };

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
