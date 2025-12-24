import {
  AppBar,
  Avatar,
  Box,
  Button,
  Toolbar,
  Typography,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../store/hooks';
import { useSignOutMutation } from '../../auth/api/authApi';
import { CsvImportFlow } from '../../transaction/components/CsvImportFlow';
import { InvestmentReportDialog } from '../../bucket/components/InvestmentReportDialog';
import { SettingsDrawer } from '../../settings/components/SettingsDrawer';
import { useState } from 'react';

export function Navbar() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();
  const [isInvestmentReportOpen, setIsInvestmentReportOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);

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
    <>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setIsSettingsDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
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
              onClick={() => setIsInvestmentReportOpen(true)}
              disabled={isSigningOut}
            >
              Report Investment Market Value
            </Button>
            <CsvImportFlow />
            <Button
              variant="outlined"
              size="small"
              onClick={handleLogout}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Logging out...' : 'Logout'}
            </Button>
          </Box>
          <InvestmentReportDialog
            open={isInvestmentReportOpen}
            onClose={() => setIsInvestmentReportOpen(false)}
          />
        </Toolbar>
      </AppBar>
      <SettingsDrawer
        open={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
      />
    </>
  );
}
