import {
  AppBar,
  Avatar,
  Box,
  Button,
  Toolbar,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../store/hooks';
import { useSignOutMutation } from '../../auth/api/authApi';
import { useDashboardError } from '../hooks/useDashboardError';

export function Navbar() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();
  const { setError } = useDashboardError();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {
      setError('Logout failed. Please try again.');
    }
  };

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexGrow: 1,
          }}
        >
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            {user?.email.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleLogout}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Logging out...' : 'Logout'}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
