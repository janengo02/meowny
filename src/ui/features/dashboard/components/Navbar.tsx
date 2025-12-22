import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../store/hooks';
import { useSignOutMutation } from '../../auth/api/authApi';
import { useDashboardError } from '../hooks/useDashboardError';
import { CsvImportFlow } from '../../transaction/components/CsvImportFlow';
import RefreshIcon from '@mui/icons-material/Refresh';
import { InvestmentReportDialog } from '../../bucket/components/InvestmentReportDialog';
import { useState } from 'react';

export function Navbar() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [signOut, { isLoading: isSigningOut }] = useSignOutMutation();
  const { setError } = useDashboardError();
  const [isInvestmentReportOpen, setIsInvestmentReportOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {
      setError('Logout failed. Please try again.');
    }
  };
  const handleRefresh = () => {
    // Trigger refetch by invalidating the cache
    window.location.reload();
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
          <IconButton
            onClick={handleRefresh}
            size="small"
            disabled={isSigningOut}
            title="Reload chart data"
          >
            <RefreshIcon />
          </IconButton>
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
   
 </>
  );
}
