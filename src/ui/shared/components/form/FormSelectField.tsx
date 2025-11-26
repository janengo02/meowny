import { useFormContext, Controller } from 'react-hook-form';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  type SelectProps,
} from '@mui/material';

export interface FormSelectFieldProps
  extends Omit<SelectProps, 'error' | 'name'> {
  name: string;
  label: string;
  options: Array<{ value: string | number; label: string }>;
}

export function FormSelectField({
  name,
  label,
  options,
  ...props
}: FormSelectFieldProps) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl fullWidth error={Boolean(error)}>
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            {...props}
            label={label}
            disabled={props.disabled ?? isSubmitting}
            value={field.value ?? ''}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
      )}
    />
  );
}
