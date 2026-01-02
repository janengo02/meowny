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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAppSelector } from '../../../store/hooks';
import { CsvImportFlow } from '../../transaction/components/CsvImportFlow';
import { InvestmentReportDialog } from '../../bucket/components/InvestmentReportDialog';
import { SettingsDrawer } from '../../settings/components/SettingsDrawer';
import { useState } from 'react';

export function Navbar() {
  const user = useAppSelector((state) => state.auth.user);
  const [isInvestmentReportOpen, setIsInvestmentReportOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);

  return (
    <>
      <AppBar
        position="sticky"
        color="default"
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
              color="warning"
              startIcon={<TrendingUpIcon />}
              onClick={() => setIsInvestmentReportOpen(true)}
            >
              Report Investment Market Value
            </Button>
            <CsvImportFlow />
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
