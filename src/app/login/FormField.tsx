'use client';

import { Box, TextField } from '../muiImports';
import { FormHelperText } from '@mui/material';
import { FormFieldProps } from './loginFormConfig';

export const FormField: React.FC<FormFieldProps> = ({
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
