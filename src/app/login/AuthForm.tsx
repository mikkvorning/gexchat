'use client';

import { Formik, FormikHelpers } from 'formik';
import { useRef, ReactNode } from 'react';
import { Box, Button, Paper, Typography, Alert } from '../muiImports';
import { FormField } from './FormField';
import { FormValues } from './formConfig';
import { getErrorMessage } from '@/utils/errorMessages';
import type { AnyObjectSchema } from 'yup';

interface FormFieldConfig {
  name: keyof FormValues;
  label: string;
  type?: string;
  required?: boolean;
}

interface AuthFormProps {
  title: string;
  subtitle: string;
  fields: FormFieldConfig[];
  validationSchema: AnyObjectSchema;
  submitButton: string;
  submitButtonLoading: string;
  onSubmit: (values: FormValues) => void;
  isPending: boolean;
  error: Error | null;
  formKey?: string;
  additionalButtons?: ReactNode;
  bottomSection?: ReactNode;
}

export const AuthForm = ({
  title,
  subtitle,
  fields,
  validationSchema,
  submitButton,
  submitButtonLoading,
  onSubmit,
  isPending,
  error,
  formKey,
  additionalButtons,
  bottomSection,
}: AuthFormProps) => {
  const formikRef = useRef<FormikHelpers<FormValues>>(null);

  const getInitialValues = (): FormValues => ({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    authError: undefined,
  });

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
            {title}
          </Typography>

          <Typography variant='subtitle2' px={2}>
            {subtitle}
          </Typography>
        </Box>

        <Formik
          key={formKey}
          initialValues={getInitialValues()}
          validationSchema={validationSchema}
          validateOnBlur={true}
          enableReinitialize
          innerRef={(formik) => {
            formikRef.current = formik;
          }}
          onSubmit={onSubmit}
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
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  values={values}
                  errors={errors}
                  touched={touched}
                  handleChange={handleChange}
                  handleBlur={handleBlur}
                  isSubmitting={isPending}
                />
              ))}

              <Button
                fullWidth
                type='submit'
                variant='contained'
                color='primary'
                disabled={isPending}
                sx={{ my: 2 }}
              >
                {isPending ? submitButtonLoading : submitButton}
              </Button>

              {additionalButtons}

              {error && (
                <Alert severity='error' sx={{ my: 2 }}>
                  {getErrorMessage(error)}
                </Alert>
              )}
            </Box>
          )}
        </Formik>

        {bottomSection}
      </Paper>
    </Box>
  );
};
