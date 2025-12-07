import { useState } from 'react';
import {
  Chip,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClearIcon from '@mui/icons-material/Clear';

interface ChipSelectOption<T extends string> {
  value: T;
  label?: string;
}

interface ChipSelectProps<T extends string> {
  value: T | null;
  options: ChipSelectOption<T>[] | T[];
  onChange?: (value: T | null) => void;
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
  placeholder?: string;
  allowClear?: boolean;
}

export function ChipSelect<T extends string>({
  value,
  options,
  onChange,
  color = 'primary',
  size = 'medium',
  variant = 'outlined',
  disabled = false,
  placeholder = 'Select',
  allowClear = false,
}: ChipSelectProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const normalizedOptions: ChipSelectOption<T>[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );

  const currentOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = value ? (currentOption?.label ?? value) : placeholder;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleSelect = (selectedValue: T) => {
    onChange?.(selectedValue);
    setAnchorEl(null);
  };

  const handleClear = () => {
    onChange?.(null);
    setAnchorEl(null);
  };

  return (
    <>
      <Chip
        label={displayLabel}
        size={size}
        color={value ? color : 'default'}
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
        {allowClear && value && (
          <>
            <MenuItem onClick={handleClear}>
              <ListItemIcon>
                <ClearIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Clear selection</ListItemText>
            </MenuItem>
            <Divider />
          </>
        )}
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
