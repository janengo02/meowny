import { TextField, type SxProps, type Theme } from '@mui/material';
import { useFormContext, useController } from 'react-hook-form';
import { NumericFormat } from 'react-number-format';

interface FormMoneyInputProps {
  name: string;
  label?: string;
  disabled?: boolean;
  prefix?: string;
  placeholder?: string;
  allowNegative?: boolean;
  textAlign?: 'left' | 'right' | 'center';
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
  showColorForSign?: boolean; // Show green for positive, red for negative
  decimalScale?: number;
  fixedDecimalScale?: boolean;
  onValueChange?: (value: string) => void;
  disableUnderline?: boolean; // Disable underline for standard variant
}

export function FormMoneyInput({
  name,
  label,
  disabled = false,
  prefix = '¥',
  placeholder = '0.00',
  allowNegative = true,
  textAlign = 'right',
  variant = 'standard',
  size = 'small',
  sx,
  showColorForSign = false,
  decimalScale = 2,
  fixedDecimalScale = false,
  onValueChange,
  disableUnderline = false,
}: FormMoneyInputProps) {
  const { control } = useFormContext();
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  // Get numeric value from field (already a number)
  const numericValue =
    typeof field.value === 'number' ? field.value : undefined;

  // Determine color based on value sign
  const getColor = () => {
    if (!showColorForSign || numericValue === undefined) return 'inherit';
    if (numericValue > 0) return 'success.main';
    if (numericValue < 0) return 'error.main';
    return 'inherit';
  };

  return (
    <NumericFormat
      value={numericValue}
      onValueChange={(values) => {
        // Store the numeric value as a number
        const newValue = values.floatValue ?? 0;
        field.onChange(newValue);
        if (onValueChange) {
          onValueChange(newValue.toString());
        }
      }}
      customInput={TextField}
      label={label}
      prefix={prefix}
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
          disableUnderline,
          sx: {
            fontWeight: 500,
            color: getColor(),
            outline: 'none',
          },
        },
        htmlInput: {
          style: {
            textAlign,
          },
        },
      }}
      sx={sx}
    />
  );
}
