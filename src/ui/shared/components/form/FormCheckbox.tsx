import { useFormContext, Controller } from 'react-hook-form';
import { Checkbox, type CheckboxProps } from '@mui/material';

export interface FormCheckboxProps extends Omit<CheckboxProps, 'name'> {
  name: string;
  onValueChange?: (checked: boolean) => void;
}

export function FormCheckbox({
  name,
  onValueChange,
  ...props
}: FormCheckboxProps) {
  const {
    control,
    formState: { isSubmitting },
  } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Checkbox
          {...field}
          {...props}
          checked={field.value ?? false}
          onChange={(e) => {
            field.onChange(e);
            onValueChange?.(e.target.checked);
          }}
          disabled={props.disabled ?? isSubmitting}
        />
      )}
    />
  );
}
