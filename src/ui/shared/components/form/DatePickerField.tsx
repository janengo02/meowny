import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import { Controller, useFormContext } from 'react-hook-form';
import type { FieldValues, Path } from 'react-hook-form';
import { FormControl, FormHelperText } from '@mui/material';

type DatePickerFieldProps<T extends FieldValues> = {
  name: Path<T>;
  size?: 'small' | 'medium';
  onChange?: (value: Dayjs | null) => void;
} & Omit<DatePickerProps<true>, 'value' | 'onChange' | 'slotProps'>;

export function DatePickerField<T extends FieldValues>({
  name,
  size = 'small',
  onChange,
  disabled,
  ...props
}: DatePickerFieldProps<T>) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext();
  const error = errors[name]?.message as string | undefined;
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={Boolean(error)}>
            <DatePicker
              {...props}
              value={field.value as Dayjs | null}
              disabled={disabled ?? isSubmitting}
              minDate={props.minDate ?? undefined}
              maxDate={props.maxDate ?? undefined}
              onChange={(newValue) => {
                if (onChange) {
                  onChange(newValue);
                } else {
                  field.onChange(newValue);
                }
              }}
              slotProps={{
                textField: {
                  size,
                  error: Boolean(error),
                },
              }}
            />
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        )}
      />
    </LocalizationProvider>
  );
}
