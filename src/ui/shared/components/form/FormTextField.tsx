import { useFormContext, Controller } from 'react-hook-form';
import { TextField, type TextFieldProps } from '@mui/material';

export interface FormTextFieldProps
  extends Omit<TextFieldProps, 'error' | 'helperText' | 'name'> {
  name: string;
  onValueChange?: (value: string) => void;
}

export function FormTextField({
  name,
  onValueChange,
  ...props
}: FormTextFieldProps) {
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  // If onValueChange is provided, use Controller for custom onChange
  if (onValueChange) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            {...props}
            onChange={(e) => {
              field.onChange(e);
              onValueChange(e.target.value);
            }}
            error={Boolean(error)}
            helperText={error}
            disabled={props.disabled ?? isSubmitting}
            fullWidth
          />
        )}
      />
    );
  }

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
