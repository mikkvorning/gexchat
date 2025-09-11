'use client';

import { Formik, FormikHelpers } from 'formik';
import { useRef, useState } from 'react';
import { Box, Button, Link, Paper, Typography, Alert } from '../muiImports';
import { FormField } from './FormField';
import {
  formFields,
  loginSchema,
  signupSchema,
  getInitialValues,
  FormValues,
} from './loginFormConfig';
import { getErrorMessage } from '@/utils/errorMessages';
import { useAuth } from './useAuth';
const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const formikRef = useRef<FormikHelpers<FormValues>>(null);
  const initialValues = getInitialValues();

  // Destructure React Query state
  const { mutate, isPending, error } = useAuth();

  const handleFormSwitch = () => {
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
    setIsSignup(!isSignup);
  };

  const handleSubmit = (values: FormValues) => {
    mutate({
      email: values.email,
      password: values.password,
      isSignup: isSignup,
      nickname: values.nickname,
    });
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
                    isSubmitting={isPending} // Use React Query state
                  />
                ))}

              <Button
                fullWidth
                type='submit'
                variant='contained'
                color='primary'
                disabled={isPending} // Use React Query state
                sx={{ mt: 2 }}
              >
                {isPending // Use React Query state
                  ? isSignup
                    ? 'Signing up...'
                    : 'Signing in...'
                  : isSignup
                  ? 'Sign up'
                  : 'Sign in'}
              </Button>
              {/* Show auth error using React Query state */}
              {error && (
                <Alert severity='error' sx={{ my: 2 }}>
                  {getErrorMessage(error)}
                </Alert>
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
