import { FormControlLabel, Switch } from '@mui/material';
import { useUpdateIncomeSourceMutation } from '../api/incomeSourceApi';

interface IncomeVisibilityToggleProps {
  incomeSourceId: number;
  isActive: boolean;
}

export function IncomeVisibilityToggle({
  incomeSourceId,
  isActive,
}: IncomeVisibilityToggleProps) {
  const [updateIncomeSource] = useUpdateIncomeSourceMutation();

  const handleToggleActive = async () => {
    try {
      await updateIncomeSource({
        id: incomeSourceId,
        params: { is_active: !isActive },
      }).unwrap();
    } catch (error) {
      console.error('Failed to toggle income source active status:', error);
    }
  };

  return (
    <FormControlLabel
      control={
        <Switch checked={isActive} onChange={handleToggleActive} size="small" />
      }
      label="Show on dashboard"
      labelPlacement="start"
      sx={{ m: 0 }}
    />
  );
}
