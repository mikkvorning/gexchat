import * as Yup from 'yup';
import { FormikErrors, FormikTouched } from 'formik';

// Form field configuration interface
export interface FormFieldConfig {
  name: keyof FormValues;
  label: string;
  type?: string;
  required?: boolean;
  showOnSignup?: boolean; // true = signup only, false = login only, undefined = both
}

export interface FormValues {
  email: string;
  password: string;
  confirmPassword?: string;
  nickname?: string;
  authError?: string;
}

export interface FormFieldProps {
  field: FormFieldConfig;
  values: FormValues;
  errors: FormikErrors<FormValues>;
  touched: FormikTouched<FormValues>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  isSubmitting: boolean;
}

// Form field configurations for login and signup
export const formFields: FormFieldConfig[] = [
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

// Validation schemas
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

// Helper function to get initial form values
export const getInitialValues = (): FormValues => ({
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  authError: undefined,
});
