import { useEffect, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import { formatDateForDB } from '../../../shared/utils/dateTime';

interface ReceivedDateInputProps {
  value: string; // ISO date string
  onSave: (value: string) => Promise<void>;
}

export function ReceivedDateInput({ value, onSave }: ReceivedDateInputProps) {
  const [displayValue, setDisplayValue] = useState<Dayjs | null>(dayjs(value));

  const handleChange = async (newValue: Dayjs | null) => {
    if (!newValue) {
      return;
    }

    // Set optimistic value for immediate UI update
    setDisplayValue(newValue);

    // Convert to ISO string and save
    const isoDate = formatDateForDB(newValue.format('YYYY-MM-DD'));
    await onSave(isoDate);
  };

  useEffect(() => {
    setDisplayValue(dayjs(value));
  }, [value]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={displayValue}
        onChange={handleChange}
        sx={{ pt: 0.5, maxWidth: 120 }}
        slotProps={{
          textField: {
            size: 'small',
            variant: 'standard',
            InputProps: {
              disableUnderline: true,
              sx: {
                fontWeight: 500,
                outline: 'none',
              },
            },
          },
          openPickerButton: {
            size: 'small',
            sx: {
              '& .MuiSvgIcon-root': {
                fontSize: '1rem',
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}
