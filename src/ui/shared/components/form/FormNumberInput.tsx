import { TextField, type SxProps, type Theme } from '@mui/material';
import { useFormContext, useController } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

interface FormNumberInputProps {
  name: string;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  allowNegative?: boolean;
  textAlign?: 'left' | 'right' | 'center';
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  decimalScale?: number;
  fixedDecimalScale?: boolean;
  onValueChange?: (value: number | undefined) => void;
}

export function FormNumberInput({
  name,
  label,
  disabled = false,
  placeholder = '0',
  allowNegative = false,
  textAlign = 'right',
  variant = 'outlined',
  size = 'medium',
  sx,
  decimalScale = 4,
  fixedDecimalScale = false,
  onValueChange,
}: FormNumberInputProps) {
  const { control } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  // Get numeric value from field
  const numericValue = typeof field.value === 'number' ? field.value : undefined;

  return (
    <NumericFormat
      value={numericValue}
      onValueChange={(values) => {
        // Store the numeric value as a number, or undefined if empty
        const newValue = values.floatValue;
        field.onChange(newValue);
        if (onValueChange) {
          onValueChange(newValue);
        }
      }}
      customInput={TextField}
      label={label}
      thousandSeparator=","
      decimalScale={decimalScale}
      fixedDecimalScale={fixedDecimalScale}
      allowNegative={allowNegative}
      placeholder={placeholder}
      disabled={disabled}
      variant={variant}
      size={size}
      error={!!error}
      helperText={error?.message}
      slotProps={{
        input: {
          sx: {
            textAlign,
            fontWeight: 500,
          },
        },
      }}
      sx={sx}
    />
  );
}
