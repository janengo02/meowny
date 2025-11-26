import { useState } from 'react';
import { Chip, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface ChipSelectOption<T extends string> {
  value: T;
  label?: string;
}

interface ChipSelectProps<T extends string> {
  value: T;
  options: ChipSelectOption<T>[] | T[];
  onChange?: (value: T) => void;
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
  disabled?: boolean;
}

export function ChipSelect<T extends string>({
  value,
  options,
  onChange,
  color = 'primary',
  size = 'small',
  variant = 'outlined',
  disabled = false,
}: ChipSelectProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const normalizedOptions: ChipSelectOption<T>[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );

  const currentOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = currentOption?.label ?? value;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleSelect = (selectedValue: T) => {
    onChange?.(selectedValue);
    setAnchorEl(null);
  };

  return (
    <>
      <Chip
        label={displayLabel}
        size={size}
        color={color}
        variant={variant}
        deleteIcon={<ArrowDropDownIcon />}
        onDelete={disabled ? undefined : handleClick}
        onClick={handleClick}
        disabled={disabled}
        sx={{ cursor: disabled ? 'default' : 'pointer' }}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {normalizedOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            onClick={() => handleSelect(option.value)}
          >
            {option.label ?? option.value}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
