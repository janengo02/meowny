import { useState, useRef } from 'react';
import {
  Chip,
  Menu,
  MenuItem,
  TextField,
  Box,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Popover,
  Button,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { AVAILABLE_COLORS } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';

interface ChipAutocompleteOption<T extends string> {
  value: T;
  label?: string;
  color?: ColorEnum;
}

interface ChipAutocompleteProps<T extends string> {
  value: T | null;
  options: ChipAutocompleteOption<T>[] | T[];
  onChange?: (value: T | null) => void;
  onCreate?: (value: string) => void;
  onColorChange?: (value: T, color: ColorEnum) => void;
  onOptionNameChange?: (value: T, newName: string) => void;
  onOptionDelete?: (value: T) => void;
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
  onColorChange,
  onOptionNameChange,
  onOptionDelete,
  size = 'medium',
  variant = 'outlined',
  disabled = false,
  placeholder = 'Search...',
  label = 'Item',
  allowClear = true,
}: ChipAutocompleteProps<T>) {
  const chipRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchText, setSearchText] = useState('');
  const [colorPickerAnchor, setColorPickerAnchor] =
    useState<null | HTMLElement>(null);
  const [selectedItemForColor, setSelectedItemForColor] = useState<T | null>(
    null,
  );
  const [editedName, setEditedName] = useState('');

  // Get theme-aware colors
  const { getColorConfig } = useThemeColors();

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

  const handleClick = () => {
    if (!disabled) {
      // Use the chip ref for stable anchor positioning
      setAnchorEl(chipRef.current);
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

  const handleColorClick = (
    event: React.MouseEvent<HTMLElement>,
    itemValue: T,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    setSelectedItemForColor(itemValue);
    setColorPickerAnchor(event.currentTarget);

    // Initialize the edited name with the current option's label
    const selectedOption = normalizedOptions.find(
      (opt) => opt.value === itemValue,
    );
    setEditedName(selectedOption?.label ?? selectedOption?.value ?? '');
  };

  const handleColorPickerClose = () => {
    setColorPickerAnchor(null);
    setSelectedItemForColor(null);
  };

  const handleColorSelect = (newColor: ColorEnum) => {
    if (selectedItemForColor && onColorChange) {
      onColorChange(selectedItemForColor, newColor);
    }
    handleColorPickerClose();
  };

  const handleNameSave = () => {
    if (selectedItemForColor && onOptionNameChange && editedName.trim()) {
      onOptionNameChange(selectedItemForColor, editedName.trim());
    }
    handleColorPickerClose();
  };

  const handleDeleteOption = () => {
    if (selectedItemForColor && onOptionDelete) {
      onOptionDelete(selectedItemForColor);
    }
    handleColorPickerClose();
  };

  const currentColor = currentOption?.color;
  const colorConfig = currentColor ? getColorConfig(currentColor) : null;

  return (
    <>
      <Box ref={chipRef} sx={{ display: 'inline-block' }}>
        <Chip
          label={displayLabel}
          size={size}
          variant={variant}
          deleteIcon={<ArrowDropDownIcon />}
          onDelete={disabled ? undefined : handleClick}
          onClick={handleClick}
          disabled={disabled}
          sx={{
            cursor: disabled ? 'default' : 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
              transform: 'translate(-1px, -1px)',
              boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
            },
            ...(colorConfig && {
              backgroundColor: `${colorConfig.bgColor} !important`,
              color: currentColor ? colorConfig.color : undefined,

              '& .MuiChip-deleteIcon': {
                color: colorConfig.color,
                '&:hover': {
                  color: colorConfig.color,
                },
              },
            }),
          }}
        />
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          // Don't close menu if color picker is open
          if (colorPickerAnchor) {
            return;
          }
          handleClose();
        }}
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
                  onClick={(e) => {
                    // Only handle selection if clicking on the MenuItem itself, not the IconButton
                    if (
                      e.target === e.currentTarget ||
                      (e.target as HTMLElement).closest('.menu-item-content')
                    ) {
                      handleSelect(option.value);
                    }
                  }}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    className="menu-item-content"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flex: 1,
                    }}
                  >
                    {option.color && (
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getColorConfig(option.color).bgColor,
                        }}
                      />
                    )}
                    {option.label ?? option.value}
                  </Box>
                  {onColorChange && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleColorClick(e, option.value)}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
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
      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={handleColorPickerClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          {onOptionNameChange && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Option name"
                  autoFocus
                  sx={{ width: 150 }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleNameSave}
                  disabled={!editedName.trim()}
                  sx={{
                    minWidth: 'auto',
                    fontSize: '0.75rem',
                    py: 0.75,
                    px: 1.25,
                  }}
                >
                  Save
                </Button>
              </Box>
            </Box>
          )}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 1,
              mb: onOptionDelete ? 2 : 0,
            }}
          >
            {AVAILABLE_COLORS.map((colorOption) => {
              const config = getColorConfig(colorOption);
              return (
                <Box
                  key={colorOption}
                  onClick={() => handleColorSelect(colorOption)}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: config.bgColor,
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    '&:hover': {
                      border: '2px solid',
                      borderColor: 'primary.main',
                    },
                  }}
                />
              );
            })}
          </Box>
          {onOptionDelete && (
            <>
              <Divider />
              <Button
                fullWidth
                variant="text"
                color="error"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteOption}
                sx={{ justifyContent: 'flex-start', mt: 1 }}
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
}
