import { useFormContext } from 'react-hook-form';
import { TextField, type TextFieldProps } from '@mui/material';

export interface FormTextFieldProps
  extends Omit<TextFieldProps, 'error' | 'helperText' | 'name'> {
  name: string;
}

export function FormTextField({ name, ...props }: FormTextFieldProps) {
  const {
    register,
    formState: { errors, isSubmitting },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  // Otherwise use register for simpler cases
  return (
    <TextField
      {...register(name)}
      {...props}
      error={Boolean(error)}
      helperText={error}
      disabled={props.disabled ?? isSubmitting}
      fullWidth
    />
  );
}
