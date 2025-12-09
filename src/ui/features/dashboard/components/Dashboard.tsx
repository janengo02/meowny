import { useState, useEffect } from 'react';
import { Box, Container, Alert, Grid } from '@mui/material';
import { Navbar } from './Navbar';
import { BucketList } from '../../bucket/components/BucketList';
import { DashboardErrorProvider } from '../context/DashboardErrorProvider';
import { useDashboardError } from '../hooks/useDashboardError';
import { IncomeList } from '../../income/components/IncomeList';
import { ChartPlaceholder } from './ChartPlaceholder';
import { AssetsOverTimeChart } from './AssetsOverTimeChart';
import { ExpensePieChart } from './ExpensePieChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

function DashboardContent() {
  const { error } = useDashboardError();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      window.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [isModalOpen]);

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

            {/* 2. Left: Saving buckets, Right: Investment buckets */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <BucketList
                  type="saving"
                  title="Saving Buckets"
                  onModalOpenChange={setIsModalOpen}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <BucketList
                  type="investment"
                  title="Investment Buckets"
                  onModalOpenChange={setIsModalOpen}
                />
              </Grid>
            </Grid>

            {/* 3. Left: Expenses chart, Right: Allowance chart */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <ExpensePieChart />
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
            <BucketList
              type="expense"
              title="Expense Buckets"
              onModalOpenChange={setIsModalOpen}
            />

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

          {/* Blank space equal to drawer width */}
          {isModalOpen && (
            <Box
              sx={{
                width: { xs: 0, md: '50vw' },
                flexShrink: 0,
                transition: 'width 0.3s ease',
              }}
            />
          )}
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
