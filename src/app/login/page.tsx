'use client';

import { useAuth } from '@/components/AuthProvider';
import { auth, db } from '@/lib/firebase';
import type { CurrentUser } from '@/types/types';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Formik, FormikHelpers } from 'formik';
import { User, sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import * as Yup from 'yup';
import { Box, Button, Link, Paper, TextField, Typography } from '../muiImports';
import { FormikErrors, FormikTouched } from 'formik';
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
const getFirebaseErrorMessage = (errorCode: string): string => {
  // prettier-ignore
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address. Please check your email or sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
    'auth/operation-not-allowed': 'Email/password sign-in is currently disabled. Please contact support.',
    'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  };

  return (
    errorMessages[errorCode] ??
    'Something went wrong. Please try again or contact support if the problem continues.'
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
      let userCredential;
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const nickname = values.nickname || values.email.split('@')[0];
        await updateProfile(userCredential.user, { displayName: nickname });
        await sendEmailVerification(userCredential.user);
        setUser(userCredential.user);
        // Set cookies for session and verification status
        document.cookie = `session=${userCredential.user.uid}; path=/;`;
        document.cookie = `emailVerified=false; path=/;`;
        // Store email for /verify page
        localStorage.setItem('lastLoginEmail', values.email);
        router.replace('/verify');
        setSubmitting(false);
        return;
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        if (!userCredential.user.emailVerified) {
          setUser(userCredential.user);
          document.cookie = `session=${userCredential.user.uid}; path=/;`;
          document.cookie = `emailVerified=false; path=/;`;
          // Store email for /verify page
          localStorage.setItem('lastLoginEmail', values.email);
          try {
            await sendEmailVerification(userCredential.user);
          } catch {
            // Ignore errors here, UI will handle resend
          }
          router.replace('/verify');
          setSubmitting(false);
          return;
        }
        // Check if user profile exists, if not create it
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (!userDoc.exists()) {
          await initializeUserProfile(
            userCredential.user,
            userCredential.user.displayName ||
              userCredential.user.email?.split('@')[0] ||
              ''
          );
        }
      }
      setUser(userCredential.user);
      document.cookie = `session=${userCredential.user.uid}; path=/;`;
      document.cookie = `emailVerified=true; path=/;`;
      router.replace('/');
    } catch (error: unknown) {
      let errorMessage = 'Something went wrong. Please try again.';
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        errorMessage = getFirebaseErrorMessage(firebaseError.code);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setErrors({ authError: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to create a new user profile in Firestore
  const initializeUserProfile = async (user: User, nickname: string) => {
    const userDoc: CurrentUser = {
      id: user.uid,
      email: user.email || '',
      displayName: nickname,
      username: nickname.toLowerCase(),
      avatarUrl: '',
      status: 'online',
      createdAt: new Date(),
      chats: [],
      privacy: {
        showStatus: true,
        showLastSeen: true,
        showActivity: true,
      },
      notifications: {
        enabled: true,
        sound: true,
        muteUntil: null,
      },
      friends: {
        list: [],
        pending: [],
      },
      blocked: [],
    };
    await setDoc(doc(db, 'users', user.uid), userDoc);
  };

  // No EmailVerification UI here anymore

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
                    {errors.authError}
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
