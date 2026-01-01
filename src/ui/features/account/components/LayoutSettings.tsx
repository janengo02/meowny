import { useState } from 'react';
import type { MouseEvent } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import SettingsIcon from '@mui/icons-material/Settings';

interface LayoutSettingsProps {
  currentColumns: 1 | 2 | 3;
  onColumnsChange: (columns: 1 | 2 | 3) => void;
}

export function LayoutSettings({
  currentColumns,
  onColumnsChange,
}: LayoutSettingsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColumnSelect = (columns: 1 | 2 | 3) => {
    onColumnsChange(columns);
    handleClose();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-label="layout settings"
        aria-controls={open ? 'layout-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <SettingsIcon />
      </IconButton>
      <Menu
        id="layout-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'layout-settings-button',
        }}
      >
        <MenuItem
          onClick={() => handleColumnSelect(1)}
          selected={currentColumns === 1}
        >
          <ListItemIcon>
            <ViewStreamIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>1 Column</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleColumnSelect(2)}
          selected={currentColumns === 2}
        >
          <ListItemIcon>
            <ViewColumnIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>2 Columns</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleColumnSelect(3)}
          selected={currentColumns === 3}
        >
          <ListItemIcon>
            <ViewWeekIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>3 Columns</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
