import { Box, Container, Alert } from '@mui/material';
import { Navbar } from './Navbar';
import { BucketList } from '../../bucket/components/BucketList';
import { DashboardErrorProvider } from '../context/DashboardErrorProvider';
import { useDashboardError } from '../hooks/useDashboardError';
import { IncomeList } from '../../income/components/IncomeList';

function DashboardContent() {
  const { error } = useDashboardError();

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 38px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        <BucketList />
        <IncomeList />
      </Container>
    </Box>
  );
}

export function Dashboard() {
  return (
    <DashboardErrorProvider>
      <DashboardContent />
    </DashboardErrorProvider>
  );
}
