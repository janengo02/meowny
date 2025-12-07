import { useEffect, useState } from 'react';
import { TextField, Typography } from '@mui/material';
import { formatDateForDB } from '../../../shared/utils/dateTime';

interface ReceivedDateInputProps {
  value: string; // ISO date string
  onSave: (value: string) => Promise<void>;
}

export function ReceivedDateInput({ value, onSave }: ReceivedDateInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayValue, setDisplayValue] = useState<string>(value);

  // Format date to YYYY-MM-DD for input field
  const formatDateForInput = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  };

  // Format date for display (e.g., "Jan 15, 2024")
  const formatDateForDisplay = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = async (newValue: string) => {
    if (!newValue) {
      setIsEditing(false);
      return;
    }

    // Convert date to ISO string (keeping only the date part)
    const isoDate = formatDateForDB(newValue);

    // Set optimistic value for immediate UI update
    setDisplayValue(isoDate);

    // Clear editing state immediately for optimistic update
    setIsEditing(false);

    // Save the value
    await onSave(isoDate);
  };

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  if (isEditing) {
    return (
      <TextField
        type="date"
        defaultValue={formatDateForInput(displayValue)}
        onBlur={(e) => {
          handleBlur(e.target.value);
        }}
        autoFocus
        size="small"
        fullWidth
        sx={{
          px: 1,
          '& .MuiInputBase-root': {
            fontSize: '0.875rem',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '& .MuiInputBase-input': {
            padding: '4px 0',
          },
        }}
      />
    );
  }

  return (
    <Typography
      variant="body2"
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        px: 1,
        py: 0.5,
        borderRadius: 0.5,
      }}
      onClick={handleClick}
    >
      {formatDateForDisplay(displayValue)}
    </Typography>
  );
}
