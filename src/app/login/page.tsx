'use client';

import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Field, Form, Formik, FormikHelpers } from 'formik';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import * as Yup from 'yup';
import { useAuth } from '@/components/AuthProvider';

interface FormValues {
  email: string;
  password: string;
  confirmPassword?: string;
}

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const signupSchema = loginSchema.shape({
  confirmPassword: Yup.string().oneOf(
    [Yup.ref('password')],
    'Passwords must match'
  ),
});

const Login = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const formikRef = useRef<FormikHelpers<FormValues>>(null);

  const initialValues = {
    email: '',
    password: '',
    ...(isSignup ? { confirmPassword: '' } : {}),
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
        userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
      }

      // Set the user in the auth context
      setUser(userCredential.user);

      // Set the session cookie
      document.cookie = `session=${userCredential.user}; path=/;`;

      // Redirect to the home page
      router.push('/');
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
    <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            {isSignup ? 'Create an Account' : 'Welcome to GexChat'}
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Connect and chat with someone, somewhere. Maybe...
          </p>
        </div>

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
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <div className='mb-8 relative'>
                <Field
                  type='email'
                  name='email'
                  placeholder='Email'
                  className='w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                  disabled={isSubmitting}
                />
                {errors.email && touched.email && (
                  <p className='text-red-500 text-sm absolute -bottom-6 left-2'>
                    {errors.email}
                  </p>
                )}
              </div>

              <div className='mb-8 relative'>
                <Field
                  type='password'
                  name='password'
                  placeholder='Password'
                  className='w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                  disabled={isSubmitting}
                />
                {errors.password && touched.password && (
                  <p className='text-red-500 text-sm absolute -bottom-6 left-2'>
                    {errors.password}
                  </p>
                )}
              </div>

              {isSignup && (
                <div className='mb-8 relative'>
                  <Field
                    type='password'
                    name='confirmPassword'
                    placeholder='Confirm Password'
                    className='w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                    disabled={isSubmitting}
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className='text-red-500 text-sm absolute -bottom-5 left-2'>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              <button
                type='submit'
                disabled={isSubmitting}
                className='w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-blue-400 transition-colors'
              >
                {isSubmitting
                  ? isSignup
                    ? 'Signing up...'
                    : 'Signing in...'
                  : isSignup
                  ? 'Sign up'
                  : 'Sign in'}
              </button>
            </Form>
          )}
        </Formik>

        <p className='mt-6 text-center text-gray-600 dark:text-gray-400'>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={handleFormSwitch}
            className='text-blue-500 dark:text-blue-400 hover:underline'
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
