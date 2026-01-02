import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import type { DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { Dayjs } from 'dayjs';
import { Controller, useFormContext } from 'react-hook-form';
import type { FieldValues, Path } from 'react-hook-form';
import { FormControl, FormHelperText } from '@mui/material';

type DateTimePickerFieldProps<T extends FieldValues> = {
  name: Path<T>;
  size?: 'small' | 'medium';
  onChange?: (value: Dayjs | null) => void;
} & Omit<DateTimePickerProps<true>, 'value' | 'onChange' | 'slotProps'>;

export function DateTimePickerField<T extends FieldValues>({
  name,
  size = 'small',
  onChange,
  disabled,
  ...props
}: DateTimePickerFieldProps<T>) {
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
            <DateTimePicker
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
                openPickerButton: {
                  size: 'small',
                  sx: {
                    '& .MuiSvgIcon-root': {
                      fontSize: '1rem',
                    },
                    padding: 0,
                    margin: 0,
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    transition: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      transform: 'none',
                      border: 'none',
                      boxShadow: 'none',
                    },
                    '&:focus': {
                      backgroundColor: 'transparent',
                      transform: 'none',
                      border: 'none',
                      boxShadow: 'none',
                    },
                    '&:active': {
                      backgroundColor: 'transparent',
                      transform: 'none',
                      border: 'none',
                      boxShadow: 'none',
                    },
                  },
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
