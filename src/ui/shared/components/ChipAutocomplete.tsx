import { useState } from 'react';
import {
  Chip,
  Menu,
  MenuItem,
  TextField,
  Box,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

interface ChipAutocompleteOption<T extends string> {
  value: T;
  label?: string;
}

interface ChipAutocompleteProps<T extends string> {
  value: T | null;
  options: ChipAutocompleteOption<T>[] | T[];
  onChange?: (value: T | null) => void;
  onCreate?: (value: string) => void;
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
  label?: string;
  allowClear?: boolean;
}

export function ChipAutocomplete<T extends string>({
  value,
  options,
  onChange,
  onCreate,
  color = 'primary',
  size = 'small',
  variant = 'outlined',
  disabled = false,
  placeholder = 'Search...',
  label = 'Item',
  allowClear = true,
}: ChipAutocompleteProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchText, setSearchText] = useState('');

  const normalizedOptions: ChipAutocompleteOption<T>[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );

  const currentOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = value ? (currentOption?.label ?? '') : `Add ${label}`;

  const filteredOptions = normalizedOptions.filter((opt) =>
    (opt.label ?? opt.value).toLowerCase().includes(searchText.toLowerCase()),
  );

  const hasExactMatch = filteredOptions.some(
    (opt) =>
      (opt.label ?? opt.value).toLowerCase() === searchText.toLowerCase(),
  );

  const showCreateOption =
    searchText.trim() !== '' && !hasExactMatch && onCreate;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
      setSearchText('');
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchText('');
  };

  const handleSelect = (selectedValue: T) => {
    onChange?.(selectedValue);
    handleClose();
  };

  const handleClear = () => {
    onChange?.(null);
    handleClose();
  };

  const handleCreate = () => {
    if (searchText.trim()) {
      onCreate?.(searchText.trim());
      handleClose();
    }
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
        sx={{
          cursor: disabled ? 'default' : 'pointer',
        }}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: { minWidth: 200 },
          },
        }}
      >
        <Box>
          <Box sx={{ px: 2, py: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={placeholder}
              value={searchText}
              onChange={(e) => {
                e.stopPropagation(); // Prevent MenuItem autofocus
                setSearchText(e.target.value);
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
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
          {filteredOptions.length > 0
            ? filteredOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  selected={option.value === value}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label ?? option.value}
                </MenuItem>
              ))
            : !showCreateOption && (
                <MenuItem disabled>No results found</MenuItem>
              )}
          {showCreateOption && (
            <MenuItem onClick={handleCreate}>
              <ListItemIcon>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Create "{searchText}"</ListItemText>
            </MenuItem>
          )}
        </Box>
      </Menu>
    </>
  );
}
