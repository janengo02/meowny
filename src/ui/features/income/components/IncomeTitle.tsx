import { TextField } from '@mui/material';
import { useUpdateIncomeSourceMutation } from '../api/incomeSourceApi';

interface IncomeTitleProps {
  incomeSource: IncomeSource;
}

export function IncomeTitle({ incomeSource }: IncomeTitleProps) {
  const [updateIncomeSource] = useUpdateIncomeSourceMutation();

  const handleNameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    if (incomeSource) {
      const trimmedName = e.target.value.trim();
      if (!trimmedName) {
        // Reset to original name if empty
        e.target.value = incomeSource.name;
      } else if (trimmedName !== incomeSource.name) {
        // Update if name changed
        await updateIncomeSource({
          id: incomeSource.id,
          params: { name: trimmedName },
        });
      }
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <TextField
      key={incomeSource.id}
      defaultValue={incomeSource.name}
      onBlur={handleNameBlur}
      onKeyDown={handleNameKeyDown}
      variant="standard"
      fullWidth
      slotProps={{
        input: {
          sx: {
            fontSize: '1.5rem',
            fontWeight: 500,
            padding: 0,
            '&:before': {
              display: 'none',
            },
            '&:after': {
              display: 'none',
            },
          },
        },
      }}
      sx={{
        mr: 2,
        '& .MuiInputBase-root': {
          '&:before': {
            display: 'none',
          },
          '&:after': {
            display: 'none',
          },
        },
      }}
    />
  );
}
