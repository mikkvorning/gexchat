import * as Yup from 'yup';
import { FormikErrors, FormikTouched } from 'formik';

export type FormState = 'login' | 'signup' | 'guest';

interface FormField {
  name: keyof FormValues;
  label: string;
  type?: string;
  required?: boolean;
}

export interface FormValues {
  email: string;
  password: string;
  confirmPassword?: string;
  nickname?: string;
  authError?: string;
}

export interface FormFieldProps {
  field: FormField;
  values: FormValues;
  errors: FormikErrors<FormValues>;
  touched: FormikTouched<FormValues>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  isSubmitting: boolean;
}

// Centralized field definitions
export const formFields = {
  nickname: {
    name: 'nickname',
    label: 'Nickname',
    required: true,
  },
  email: {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
  },
  password: {
    name: 'password',
    label: 'Password',
    type: 'password',
    required: true,
  },
  confirmPassword: {
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    required: true,
  },
} as const satisfies Record<string, FormField>;

// Form configurations for each form type
export const formConfigs: Record<
  FormState,
  {
    title: string;
    subtitle: string;
    fields: FormField[];
    submitButton: string;
    submitButtonLoading: string;
  }
> = {
  login: {
    title: 'Welcome to GexChat',
    subtitle: "Let's see if you still remember your login!",
    fields: [formFields.email, formFields.password],
    submitButton: 'Sign in',
    submitButtonLoading: 'Signing in...',
  },
  signup: {
    title: 'Create an Account',
    subtitle: 'Now which name to use? Hmmm...',
    fields: [
      formFields.nickname,
      formFields.email,
      formFields.password,
      formFields.confirmPassword,
    ],
    submitButton: 'Sign up',
    submitButtonLoading: 'Signing up...',
  },
  guest: {
    title: 'Continue as Guest',
    subtitle: 'Pick a nickname and jump right in!',
    fields: [formFields.nickname],
    submitButton: 'Continue as Guest',
    submitButtonLoading: 'Creating guest account...',
  },
}; // Validation schemas
export const loginSchema = Yup.object().shape({
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

export const signupSchema = loginSchema.shape({
  confirmPassword: Yup.string().oneOf(
    [Yup.ref('password')],
    'Passwords must match'
  ),
  nickname: Yup.string()
    .required('Nickname is required')
    .max(30, 'Nickname may not exceed 30 characters'),
});

export const guestSchema = Yup.object().shape({
  nickname: Yup.string()
    .required('Nickname is required')
    .max(30, 'Nickname may not exceed 30 characters'),
  authError: Yup.string().optional(),
});

// Validation schema mapping
export const validationSchemas: Record<FormState, Yup.AnyObjectSchema> = {
  login: loginSchema,
  signup: signupSchema,
  guest: guestSchema,
};

// Helper function to get initial form values
export const getInitialValues = (): FormValues => ({
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  authError: undefined,
});
