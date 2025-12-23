import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useGetAllBucketGoalsWithStatusQuery } from '../../bucket/api/bucketGoalApi';
import { useMemo, useState } from 'react';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { horizontalBarChartOptions } from '../../../shared/utils/chart';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function BucketGoalsChart() {
  const [selectedTab, setSelectedTab] = useState<BucketTypeEnum>('expense');
  const {
    data: goalsData,
    isLoading,
    error,
  } = useGetAllBucketGoalsWithStatusQuery();

  const chartData = useMemo(() => {
    if (!goalsData || goalsData.length === 0) {
      return null;
    }

    // Filter goals by selected bucket type using the bucket_type from the query
    const filteredGoals = goalsData.filter(
      (goal) => goal.bucket_type === selectedTab,
    );

    if (filteredGoals.length === 0) {
      return null;
    }

    const labels = filteredGoals.map((goal) => goal.bucket_name);

    // Calculate percentages where max_amount (if exists) = 100%
    // Stacking structure based on current_status position:
    // 1. current < min: [current] yellow, [min-current] transparent, [max-min] transparent
    // 2. min <= current <= max: [min] green, [current-min] green, [max-current] transparent
    // 3. current > max: [min] green, [max-min] green, [current-max] red

    // Pre-calculate common values for each goal
    const goalMetrics = filteredGoals.map((goal) => {
      const base100 = goal.max_amount ?? goal.min_amount ?? 0;
      const minAmount = goal.min_amount ?? 0;
      const maxAmount = goal.max_amount ?? 0;
      const currentStatus = goal.current_status;
      const currentPercent = base100 > 0 ? (currentStatus / base100) * 100 : 0;
      const minPercent =
        base100 > 0 && minAmount > 0 ? (minAmount / base100) * 100 : 0;

      return {
        base100,
        minAmount,
        maxAmount,
        currentStatus,
        currentPercent,
        minPercent,
      };
    });

    // Layer 1: Yellow when current < min (shows current_status)
    const yellowCurrent = goalMetrics.reduce(
      (acc: { data: number[]; metadata: number[] }, metric) => {
        if (metric.currentPercent < metric.minPercent) {
          acc.data.push(metric.currentPercent);
          acc.metadata.push(metric.currentStatus);
        } else {
          acc.data.push(0);
          acc.metadata.push(0);
        }
        return acc;
      },
      { data: [] as number[], metadata: [] as number[] },
    );

    // Layer 2: Transparent outline when current < min (shows min - current)
    const transparentMinRemaining = goalMetrics.reduce(
      (
        acc: {
          data: number[];
          metadata: { amount: number; target?: number }[];
        },
        metric,
      ) => {
        if (
          metric.base100 > 0 &&
          metric.minAmount > 0 &&
          metric.currentPercent < metric.minPercent
        ) {
          acc.data.push(metric.minPercent - metric.currentPercent);
          acc.metadata.push({
            amount: metric.minAmount - metric.currentStatus,
            target: metric.minAmount,
          });
        } else {
          acc.data.push(0);
          acc.metadata.push({ amount: 0 });
        }
        return acc;
      },
      { data: [], metadata: [] },
    );

    // Layer 3: Green when current >= min (shows min amount)
    const greenMin = goalMetrics.reduce(
      (acc: { data: number[]; metadata: number[] }, metric) => {
        if (!metric.minAmount && metric.maxAmount) {
          acc.data.push(0);
          acc.metadata.push(0);
        } else if (metric.currentPercent >= metric.minPercent) {
          acc.data.push(metric.minPercent);
          acc.metadata.push(metric.minAmount);
        } else {
          acc.data.push(0);
          acc.metadata.push(0);
        }
        return acc;
      },
      { data: [], metadata: [] },
    );

    // Layer 4: Green when min <= current <= max (shows current - min)
    const greenCurrent = goalMetrics.reduce(
      (acc: { data: number[]; metadata: number[] }, metric) => {
        if (!metric.minAmount && metric.maxAmount) {
          acc.data.push(Math.min(metric.currentPercent, 100));
          acc.metadata.push(Math.min(metric.currentStatus, metric.maxAmount));
        } else if (metric.currentPercent < metric.minPercent) {
          acc.data.push(0);
          acc.metadata.push(0);
        } else if (metric.maxAmount) {
          acc.data.push(
            Math.min(
              metric.currentPercent - metric.minPercent,
              100 - metric.minPercent,
            ),
          );
          acc.metadata.push(
            Math.min(metric.currentStatus, metric.maxAmount) - metric.minAmount,
          );
        } else {
          acc.data.push(metric.currentPercent - metric.minPercent);
          acc.metadata.push(metric.currentStatus - metric.minAmount);
        }
        return acc;
      },
      { data: [], metadata: [] },
    );

    // Layer 5: Transparent outline when max exists
    const transparentMaxRemaining = goalMetrics.reduce(
      (
        acc: {
          data: number[];
          metadata: { amount: number; target?: number }[];
        },
        metric,
      ) => {
        if (!metric.maxAmount) {
          acc.data.push(0);
          acc.metadata.push({ amount: 0 });
        } else if (metric.currentPercent < metric.minPercent) {
          acc.data.push(100 - metric.minPercent);
          acc.metadata.push({
            amount: metric.maxAmount - metric.minAmount,
            target: metric.maxAmount,
          });
        } else {
          acc.data.push(100 - Math.min(metric.currentPercent, 100));
          acc.metadata.push({
            amount:
              metric.maxAmount -
              Math.min(metric.currentStatus, metric.maxAmount),
            target: metric.maxAmount,
          });
        }
        return acc;
      },
      { data: [], metadata: [] },
    );

    // Layer 6: Red when current > max (shows current - max)
    const redExceedMax = goalMetrics.reduce(
      (acc: { data: number[]; metadata: number[] }, metric) => {
        if (metric.maxAmount > 0) {
          acc.data.push(Math.max(0, metric.currentPercent - 100));
          acc.metadata.push(
            Math.max(0, metric.currentStatus - metric.maxAmount),
          );
        } else {
          acc.data.push(0);
          acc.metadata.push(0);
        }
        return acc;
      },
      { data: [], metadata: [] },
    );

    return {
      labels,
      datasets: [
        // Layer 1: Yellow current (when current < min)
        {
          label: 'Below Min',
          data: yellowCurrent.data,
          backgroundColor: 'rgba(255, 206, 86, 0.8)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: yellowCurrent.metadata,
        },
        // Layer 2: Transparent (min - current) when current < min
        {
          label: 'To Min Goal',
          data: transparentMinRemaining.data,
          backgroundColor: 'rgba(255, 255, 255, 0)',
          borderColor: 'rgba(255, 206, 86, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: transparentMinRemaining.metadata,
        },
        // Layer 3: Green min (when current >= min)
        {
          label: 'Min Goal Met',
          data: greenMin.data,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: greenMin.metadata,
        },
        // Layer 4: Green (current - min) when min <= current <= max
        {
          label: 'On Track',
          data: greenCurrent.data,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: greenCurrent.metadata,
        },
        // Layer 5: Transparent (max - current) when current <= max
        {
          label: 'To Max Goal',
          data: transparentMaxRemaining.data,
          backgroundColor: 'rgba(255, 255, 255, 0)',
          borderColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: transparentMaxRemaining.metadata,
        },
        // Layer 6: Red (current - max) when current > max
        {
          label: 'Over Max',
          data: redExceedMax.data,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 0.5)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: redExceedMax.metadata,
        },
      ],
    };
  }, [goalsData, selectedTab]);

  if (isLoading) {
    return (
      <Card sx={{ height: 250 }}>
        <CardContent
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: 500 }}>
      <CardContent
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Typography variant="h2">Goals</Typography>
        </Box>

        {/* Tabs for bucket types */}
        <Tabs
          value={selectedTab}
          onChange={(_event, newValue: BucketTypeEnum) =>
            setSelectedTab(newValue)
          }
          sx={{ minHeight: 36 }}
        >
          <Tab label="Expense" value="expense" sx={{ minHeight: 36, py: 1 }} />
          <Tab label="Saving" value="saving" sx={{ minHeight: 36, py: 1 }} />
          <Tab
            label="Investment"
            value="investment"
            sx={{ minHeight: 36, py: 1 }}
          />
        </Tabs>

        {/* Chart */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {error ? (
            <ErrorState
              title="Failed to load bucket goals"
              description="Please try refreshing the page"
            />
          ) : chartData ? (
            <Bar data={chartData} options={horizontalBarChartOptions} />
          ) : (
            <EmptyState
              icon={
                <TrendingUpIcon
                  sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }}
                />
              }
              title="No active bucket goals"
              description="Create bucket goals with max amounts to track your progress"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
