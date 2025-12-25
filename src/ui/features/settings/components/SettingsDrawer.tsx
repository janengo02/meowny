import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 280 }}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">Menu</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigate('/dashboard')}>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider />
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            SETTINGS
          </Typography>
        </Box>

        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigate('/settings/hidden-buckets')}>
              <ListItemText primary="Hidden Buckets" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigate('/settings/hidden-income-sources')}>
              <ListItemText primary="Hidden Income Sources" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}
