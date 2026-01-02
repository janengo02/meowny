import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Typography,
  Box,
  IconButton,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useSignOutMutation } from '../../auth/api/authApi';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const navigate = useNavigate();
  const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to login on error
      navigate('/login');
    }
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box
        sx={{
          width: 280,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h3">Menu</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigate('/dashboard')}>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
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
              <ListItemButton
                onClick={() => handleNavigate('/settings/hidden-buckets')}
              >
                <ListItemIcon>
                  <VisibilityOffIcon />
                </ListItemIcon>
                <ListItemText primary="Hidden Buckets" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() =>
                  handleNavigate('/settings/hidden-income-sources')
                }
              >
                <ListItemIcon>
                  <VisibilityOffIcon />
                </ListItemIcon>
                <ListItemText primary="Hidden Income Sources" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleLogout}
              disabled={isSigningOut}
              fullWidth
            >
              {isSigningOut ? 'Logging out...' : 'Logout'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
