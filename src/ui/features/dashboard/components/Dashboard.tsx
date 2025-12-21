import { Box, Container, Alert, Grid } from '@mui/material';
import { Navbar } from './Navbar';
import { AccountList } from '../../account/components/AccountList';
import { DashboardErrorProvider } from '../context/DashboardErrorProvider';
import { useDashboardError } from '../hooks/useDashboardError';
import { IncomeList } from '../../income/components/IncomeList';
import { AssetsOverTimeChart } from './AssetsOverTimeChart';
import { ExpensePieChart } from './ExpensePieChart';
import { BucketGoalsChart } from './BucketGoalsChart';
import { IncomeOverTimeChart } from './IncomeOverTimeChart';
import { IncomeVsSavingsChart } from './IncomeVsSavingsChart';
import { useGetAccountsWithBucketsQuery } from '../../account/api/accountApi';

function DashboardContent() {
  const { error } = useDashboardError();

  // Fetch all accounts with their buckets to populate the store
  useGetAccountsWithBucketsQuery();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />
      <Box
        sx={{
          width: '100%',
          overflowX: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
          }}
        >
          <Container
            maxWidth="xl"
            sx={{ py: 4, flexShrink: 0, flexGrow: 0, width: '100%' }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* 1. Full width Assets chart */}
            <Box sx={{ mb: 4 }}>
              <AssetsOverTimeChart />
            </Box>

            {/* 2. Asset accounts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12 }}>
                <AccountList type="asset" />
              </Grid>
            </Grid>

            {/* 3. Left: Expenses chart, Right: Allowance chart */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <ExpensePieChart />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <BucketGoalsChart />
              </Grid>
            </Grid>

            {/* 4. Expense accounts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 12 }}>
                <AccountList type="expense" />
              </Grid>
            </Grid>
            {/* 5. Left: Income chart, Right: Income Vs Saving chart */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <IncomeOverTimeChart />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <IncomeVsSavingsChart />
              </Grid>
            </Grid>

            {/* 6. Income sources */}
            <IncomeList />
          </Container>
        </Box>
      </Box>
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
