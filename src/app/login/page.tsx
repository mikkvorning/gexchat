'use client';

import { useAuth } from '@/components/AuthProvider';
import { auth, db } from '@/lib/firebase';
import type { CurrentUser } from '@/types/types';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Formik, FormikHelpers } from 'formik';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import * as Yup from 'yup';
import { Box, Button, Link, Paper, TextField, Typography } from '../muiImports';
import { FormikErrors, FormikTouched } from 'formik';
import { FormHelperText } from '@mui/material';
import {
  saveVerificationEmail,
  getVerificationEmail,
  clearVerificationEmail,
} from '@/utils/storage';

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
    'auth/expired-action-code': 'This verification link has expired. Please request a new one.',
    'auth/invalid-action-code': 'This verification link is invalid or has already been used.',
    'auth/email-not-verified': 'Please verify your email address before signing in. Check your inbox for the verification email.',
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
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);
  const [hasResentEmail, setHasResentEmail] = useState(false);
  const formikRef = useRef<FormikHelpers<FormValues>>(null);

  // Load verification state from sessionStorage on mount
  useEffect(() => {
    const verificationData = getVerificationEmail();
    if (verificationData) {
      setVerificationEmail(verificationData.email);
      setEmailVerificationSent(true);
    }
  }, []);
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
    setEmailVerificationSent(false);
    setVerificationEmail('');
    setUnverifiedUser(null);
    setHasResentEmail(false);
    clearVerificationEmail();
    setIsSignup(!isSignup);
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;

    setIsResending(true);
    try {
      // Try to use the stored unverified user first
      if (unverifiedUser && unverifiedUser.email === verificationEmail) {
        await sendEmailVerification(unverifiedUser);
        setHasResentEmail(true);
        return;
      }

      // Fallback: try to get the current user from auth state
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email === verificationEmail) {
        await sendEmailVerification(currentUser);
        setHasResentEmail(true);
        return;
      }

      // If no user available, we can't resend verification emails
      console.error('No authenticated user found for resending verification');
      // You could show an error message here
    } catch (error: unknown) {
      console.error('Failed to resend verification email:', error);
      // You could show an error message here
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, setErrors }: FormikHelpers<FormValues>
  ) => {
    try {
      // Clear any previous auth errors
      setErrors({ authError: undefined });

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

        // Send email verification
        await sendEmailVerification(userCredential.user);
        setEmailVerificationSent(true);
        setVerificationEmail(values.email);
        // Persist to sessionStorage with timestamp (expires after 15 minutes)
        saveVerificationEmail(values.email);

        // Save user data to Firestore
        const userDoc: CurrentUser = {
          id: userCredential.user.uid,
          email: values.email,
          displayName: nickname,
          username: nickname.toLowerCase(), // Store lowercase version for search
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
        await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

        // Don't redirect yet - show verification message
        return;
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );

        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          // Store the unverified user so we can resend verification emails
          setUnverifiedUser(userCredential.user);
          setVerificationEmail(values.email);
          // Store in sessionStorage for persistence
          saveVerificationEmail(values.email);

          setErrors({
            authError: getFirebaseErrorMessage('auth/email-not-verified'),
          });
          return;
        }
      }

      // Set the user in the auth context
      setUser(userCredential.user);

      // Clear any pending verification email from sessionStorage
      clearVerificationEmail();
      setUnverifiedUser(null);

      // Set the session cookie properly with the user's ID
      document.cookie = `session=${userCredential.user.uid}; path=/;`;

      // Redirect to the home page using replace to prevent back navigation
      router.replace('/');
    } catch (error: unknown) {
      let errorMessage = 'Something went wrong. Please try again.';

      // Handle Firebase Auth errors with user-friendly messages
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        errorMessage = getFirebaseErrorMessage(firebaseError.code);
      } else if (error instanceof Error) {
        errorMessage = error.message; // Fallback for non-Firebase errors
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
            {emailVerificationSent
              ? 'Verify Your Email'
              : isSignup
              ? 'Create an Account'
              : 'Welcome to GexChat'}
          </Typography>

          {/* Some kinda casual tagline here */}
          <Typography variant='subtitle2' px={2}>
            {emailVerificationSent
              ? 'We sent a verification email to your inbox. Please click the link to verify your account before signing in.'
              : isSignup
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
              {!emailVerificationSent && (
                <>
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
                </>
              )}

              {emailVerificationSent && (
                <>
                  <Button
                    fullWidth
                    variant='outlined'
                    color='primary'
                    onClick={() => {
                      setEmailVerificationSent(false);
                      setVerificationEmail('');
                      clearVerificationEmail();
                      setIsSignup(false);
                    }}
                    sx={{ mt: 2 }}
                  >
                    Back to Sign In
                  </Button>
                  <Button
                    fullWidth
                    variant='text'
                    color='secondary'
                    onClick={handleResendVerification}
                    disabled={isResending}
                    sx={{ mt: 1 }}
                  >
                    {isResending ? 'Resending...' : 'Resend Verification Email'}
                  </Button>
                </>
              )}

              {errors.authError && (
                <Typography
                  color='error'
                  variant='body2'
                  my={2}
                  textAlign='center'
                >
                  {errors.authError ===
                    getFirebaseErrorMessage('auth/email-not-verified') &&
                  hasResentEmail
                    ? 'Check your email inbox for a new verification link.'
                    : errors.authError}
                </Typography>
              )}

              {/* Show appropriate link based on context */}
              {!emailVerificationSent && (
                <Box mt={4} textAlign='center'>
                  <Typography color='text.secondary'>
                    {errors.authError?.includes('verify your email')
                      ? hasResentEmail
                        ? "Still didn't receive it?"
                        : "Didn't receive a verification email?"
                      : isSignup
                      ? 'Already have an account?'
                      : "Don't have an account?"}
                    <Link
                      component='button'
                      onClick={
                        errors.authError?.includes('verify your email')
                          ? handleResendVerification
                          : handleFormSwitch
                      }
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        mx: 1,
                        position: 'relative',
                        top: -2,
                      }}
                      disabled={isResending}
                    >
                      {errors.authError ===
                      getFirebaseErrorMessage('auth/email-not-verified')
                        ? isResending
                          ? 'Resending...'
                          : hasResentEmail
                          ? 'Resend again'
                          : 'Resend'
                        : isSignup
                        ? 'Sign in'
                        : 'Sign up'}
                    </Link>
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

export default Login;
