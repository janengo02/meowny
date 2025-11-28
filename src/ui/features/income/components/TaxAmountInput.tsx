import { useEffect, useState } from 'react';
import { TextField, Typography } from '@mui/material';
import { formatMoney } from '../../../shared/utils';

interface TaxAmountInputProps {
  value: number;
  onSave: (value: number) => Promise<void>;
}

export function TaxAmountInput({ value, onSave }: TaxAmountInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  const [displayValue, setDisplayValue] = useState<number>(value);

  const handleClick = () => {
    setIsEditing(true);
    setDefaultValue(formatMoney(value));
  };

  const handleBlur = async (newValue: string) => {
    // Remove all symbols and parse only the meaningful number
    const cleanValue = newValue.replace(/[^0-9.-]/g, '');
    const newAmount = parseFloat(cleanValue || '0');

    // Set optimistic value for immediate UI update
    setDisplayValue(newAmount);

    // Clear editing state immediately for optimistic update
    setIsEditing(false);
    setDefaultValue('');

    // Save the value
    await onSave(newAmount);
  };

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  if (isEditing) {
    return (
      <TextField
        type="text"
        defaultValue={defaultValue}
        onBlur={(e) => {
          handleBlur(e.target.value);
        }}
        autoFocus
        size="small"
        fullWidth
        sx={{
          input: { textAlign: 'right', fontWeight: 600 },
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
        fontWeight: 600,
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
      {formatMoney(displayValue)}
    </Typography>
  );
}
