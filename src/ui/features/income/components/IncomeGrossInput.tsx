import { useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import { NumericFormat } from 'react-number-format';

interface IncomeGrossInputProps {
  value: number;
  onSave: (value: number) => Promise<void>;
}

export function IncomeGrossInput({ value, onSave }: IncomeGrossInputProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);

  const handleBlur = async (floatValue: number | undefined) => {
    const newAmount = floatValue ?? 0;

    // Set optimistic value for immediate UI update
    setDisplayValue(newAmount);

    // Save the value
    await onSave(newAmount);
  };

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <NumericFormat
      value={displayValue}
      onBlur={(e) => {
        const floatValue = parseFloat(e.target.value.replace(/[^0-9.-]/g, ''));
        handleBlur(isNaN(floatValue) ? 0 : floatValue);
      }}
      onValueChange={(values) => {
        setDisplayValue(values.floatValue ?? 0);
      }}
      customInput={TextField}
      prefix="¥"
      thousandSeparator=","
      decimalScale={2}
      size="small"
      variant="standard"
      fullWidth
      slotProps={{
        input: {
          disableUnderline: true,
          sx: {
            fontWeight: 500,
            outline: 'none',
          },
        },
        htmlInput: {
          style: {
            textAlign: 'right',
            paddingTop: 6,
          },
        },
      }}
    />
  );
}
