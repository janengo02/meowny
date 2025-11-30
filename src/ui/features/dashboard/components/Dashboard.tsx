import { Box, Container, Alert, Grid } from '@mui/material';
import { Navbar } from './Navbar';
import { BucketList } from '../../bucket/components/BucketList';
import { DashboardErrorProvider } from '../context/DashboardErrorProvider';
import { useDashboardError } from '../hooks/useDashboardError';
import { IncomeList } from '../../income/components/IncomeList';
import { ChartPlaceholder } from './ChartPlaceholder';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

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

        {/* 1. Full width Assets chart */}
        <Box sx={{ mb: 4 }}>
          <ChartPlaceholder
            title="Assets Over Time"
            height={300}
            icon={<ShowChartIcon sx={{ fontSize: 48 }} />}
          />
        </Box>

        {/* 2. Left: Saving buckets, Right: Investment buckets */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <BucketList type="saving" title="Saving Buckets" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <BucketList type="investment" title="Investment Buckets" />
          </Grid>
        </Grid>

        {/* 3. Left: Expenses chart, Right: Allowance chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartPlaceholder
              title="Expenses"
              height={250}
              icon={<AccountBalanceWalletIcon sx={{ fontSize: 48 }} />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartPlaceholder
              title="Allowance"
              height={250}
              icon={<TrendingUpIcon sx={{ fontSize: 48 }} />}
            />
          </Grid>
        </Grid>

        {/* 4. Expense buckets */}
        <BucketList type="expense" title="Expense Buckets" />

        {/* 5. Left: Income chart, Right: Income Vs Saving chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartPlaceholder
              title="Income Over Time"
              height={250}
              icon={<TrendingUpIcon sx={{ fontSize: 48 }} />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartPlaceholder
              title="Income vs Savings"
              height={250}
              icon={<CompareArrowsIcon sx={{ fontSize: 48 }} />}
            />
          </Grid>
        </Grid>

        {/* 6. Income sources */}
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
