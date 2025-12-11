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
  type ChartOptions,
} from 'chart.js';
import { useGetAllBucketGoalsWithStatusQuery } from '../../bucket/api/bucketGoalApi';
import { useMemo, useState } from 'react';
import { formatMoney } from '../../../shared/utils/formatMoney';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { useGetBucketsQuery } from '../../bucket/api/bucketApi';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Custom dataset type with metadata
interface DatasetWithMetadata {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  metadata: number[];
}

const barChartOptions: ChartOptions<'bar'> = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      beginAtZero: true,
      stacked: true,
      ticks: {
        callback: function (value) {
          return value + '%';
        },
      },
    },
    y: {
      stacked: true,
      ticks: {
        font: {
          size: 11,
        },
      },
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        padding: 8,
        font: {
          size: 10,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const datasetLabel = context.dataset.label || '';
          const value = context.parsed.x || 0;
          const dataIndex = context.dataIndex;

          // Get the actual amounts from the dataset metadata
          const dataset = context.dataset as unknown as DatasetWithMetadata;
          if (!dataset.metadata || !dataset.metadata[dataIndex]) {
            return `${datasetLabel}: ${value.toFixed(1)}%`;
          }

          const actualAmount = dataset.metadata[dataIndex];
          return `${datasetLabel}: ${formatMoney(actualAmount)} (${value.toFixed(1)}%)`;
        },
      },
    },
  },
};

type BucketType = 'saving' | 'investment' | 'expense';

export function BucketGoalsChart() {
  const [selectedTab, setSelectedTab] = useState<BucketType>('expense');
  const { data: goalsData, isLoading, error } = useGetAllBucketGoalsWithStatusQuery();
  const { data: bucketsData } = useGetBucketsQuery();

  const chartData = useMemo(() => {
    if (!goalsData || goalsData.length === 0 || !bucketsData) {
      return null;
    }

    // Create a map of bucket_id to bucket type
    const bucketTypeMap = new Map<number, BucketType>();
    bucketsData.forEach((bucket) => {
      bucketTypeMap.set(bucket.id, bucket.type as BucketType);
    });

    // Filter goals by selected bucket type
    const filteredGoals = goalsData.filter((goal) => {
      const bucketType = bucketTypeMap.get(goal.bucket_id);
      return bucketType === selectedTab;
    });

    // Filter out goals without any amount set (need at least min_amount)
    const validGoals = filteredGoals.filter((goal) =>
      (goal.max_amount && goal.max_amount > 0) || (goal.min_amount && goal.min_amount > 0)
    );

    if (validGoals.length === 0) {
      return null;
    }

    const labels = validGoals.map((goal) => {
      // Only show actual amount if exceeds max_amount (not min_amount)
      if (goal.max_amount && goal.current_status > goal.max_amount) {
        return `${goal.bucket_name} (${formatMoney(goal.current_status)})`;
      }
      return goal.bucket_name;
    });

    // Calculate percentages where max_amount (if exists) = 100%
    // Stacking structure based on current_status position:
    // 1. current < min: [current] yellow, [min-current] transparent, [max-min] transparent
    // 2. min <= current <= max: [min] green, [current-min] green, [max-current] transparent
    // 3. current > max: [min] green, [max-min] green, [current-max] red

    // Layer 1: Yellow when current < min (shows current_status)
    const yellowCurrentData = validGoals.map((goal) => {
      // Always use max_amount as 100% if it exists, otherwise use min_amount
      const base100 = goal.max_amount ?? goal.min_amount ?? 0;
      const minAmount = goal.min_amount ?? 0;
      if (!base100) return 0;

      const currentPercent = (goal.current_status / base100) * 100;
      const minPercent = minAmount ? (minAmount / base100) * 100 : 0;

      // Yellow: current_status only when current < min
      return currentPercent < minPercent ? currentPercent : 0;
    });

    // Layer 2: Transparent outline when current < min (shows min - current)
    const transparentMinRemainingData = validGoals.map((goal) => {
      const base100 = goal.max_amount ?? goal.min_amount ?? 0;
      const minAmount = goal.min_amount ?? 0;
      if (!base100 || !minAmount) return 0;

      const currentPercent = (goal.current_status / base100) * 100;
      const minPercent = (minAmount / base100) * 100;

      // Transparent: (min - current) only when current < min
      return currentPercent < minPercent ? minPercent - currentPercent : 0;
    });

    // Layer 3: Green when current >= min (shows min amount)
    const greenMinData = validGoals.map((goal) => {
      const base100 = goal.max_amount ?? goal.min_amount ?? 0;
      const minAmount = goal.min_amount ?? 0;
      if (!base100) return 0;

      const currentPercent = (goal.current_status / base100) * 100;
      const minPercent = minAmount ? (minAmount / base100) * 100 : 0;

      // If only max_amount (no min): no green min bar
      if (!minAmount && goal.max_amount) {
        return 0;
      }

      // Green min: only when current >= min
      return currentPercent >= minPercent ? minPercent : 0;
    });

    // Layer 4: Green when min <= current <= max (shows current - min)
    const greenCurrentData = validGoals.map((goal) => {
      const base100 = goal.max_amount ?? goal.min_amount ?? 0;
      const minAmount = goal.min_amount ?? 0;
      if (!base100) return 0;

      const currentPercent = (goal.current_status / base100) * 100;
      const minPercent = minAmount ? (minAmount / base100) * 100 : 0;

      // If only max_amount (no min): green for everything up to 100%
      if (!minAmount && goal.max_amount) {
        return Math.min(currentPercent, 100);
      }

      // If current < min: no green current bar
      if (currentPercent < minPercent) {
        return 0;
      }

      // If has max: green (current - min) capped at (100% - min%)
      if (goal.max_amount) {
        return Math.min(currentPercent - minPercent, 100 - minPercent);
      }

      // If only min (no max): green for (current - min), uncapped
      return currentPercent - minPercent;
    });

    // Layer 5: Transparent outline when max exists
    // If current < min: shows (max - min)
    // If current >= min: shows (max - current)
    const transparentMaxRemainingData = validGoals.map((goal) => {
      // Only show this if max_amount exists
      if (!goal.max_amount) return 0;

      const base100 = goal.max_amount;
      const minAmount = goal.min_amount ?? 0;
      const currentPercent = (goal.current_status / base100) * 100;
      const minPercent = minAmount ? (minAmount / base100) * 100 : 0;

      // If current < min: show (max - min) = (100% - min%)
      if (currentPercent < minPercent) {
        return 100 - minPercent;
      }

      // If current >= min: show (max - current) = (100% - current%)
      return currentPercent < 100 ? 100 - currentPercent : 0;
    });

    // Layer 6: Red when current > max (shows current - max)
    const redData = validGoals.map((goal) => {
      // Only show red if max_amount exists
      if (!goal.max_amount) return 0;

      const base100 = goal.max_amount;
      const currentPercent = (goal.current_status / base100) * 100;

      // Red: (current - 100%) only when current > 100%
      return Math.max(0, currentPercent - 100);
    });

    return {
      labels,
      datasets: [
        // Layer 1: Yellow current (when current < min)
        {
          label: 'Below Min',
          data: yellowCurrentData,
          backgroundColor: 'rgba(255, 206, 86, 0.8)', // Yellow
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: validGoals.map((goal) => {
            const minAmount = goal.min_amount ?? 0;
            return goal.current_status < minAmount ? goal.current_status : 0;
          }),
        },
        // Layer 2: Transparent (min - current) when current < min
        {
          label: 'To Min Goal',
          data: transparentMinRemainingData,
          backgroundColor: 'rgba(255, 255, 255, 0)', // Transparent
          borderColor: 'rgba(255, 206, 86, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: validGoals.map((goal) => {
            const minAmount = goal.min_amount ?? 0;
            return goal.current_status < minAmount ? minAmount - goal.current_status : 0;
          }),
        },
        // Layer 3: Green min (when current >= min)
        {
          label: 'Min Goal Met',
          data: greenMinData,
          backgroundColor: 'rgba(75, 192, 192, 0.9)', // Darker teal green
          borderColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: validGoals.map((goal) => {
            const minAmount = goal.min_amount ?? 0;
            return goal.current_status >= minAmount ? minAmount : 0;
          }),
        },
        // Layer 4: Green (current - min) when min <= current <= max
        {
          label: 'On Track',
          data: greenCurrentData,
          backgroundColor: 'rgba(75, 192, 192, 0.9)', // Lighter mint green
          borderColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: validGoals.map((goal) => {
            const minAmount = goal.min_amount ?? 0;
            const maxAmount = goal.max_amount ?? 0;

            // If only max_amount (no min): green for everything up to max
            if (!minAmount && maxAmount) {
              return Math.min(goal.current_status, maxAmount);
            }

            // If current < min: no green
            if (goal.current_status < minAmount) {
              return 0;
            }

            // If has max: green (current - min) capped at max
            if (maxAmount) {
              return Math.min(goal.current_status, maxAmount) - minAmount;
            }

            // If only min (no max): green for (current - min)
            return goal.current_status - minAmount;
          }),
        },
        // Layer 5: Transparent (max - current) when current <= max
        {
          label: 'To Max Goal',
          data: transparentMaxRemainingData,
          backgroundColor: 'rgba(255, 255, 255, 0)', // Transparent
          borderColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: validGoals.map((goal) => {
            const maxAmount = goal.max_amount ?? 0;
            return maxAmount && goal.current_status < maxAmount
              ? maxAmount - goal.current_status
              : 0;
          }),
        },
        // Layer 6: Red (current - max) when current > max
        {
          label: 'Over Max',
          data: redData,
          backgroundColor: 'rgba(255, 99, 132, 0.8)', // Red
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: validGoals.map((goal) => {
            const maxAmount = goal.max_amount ?? 0;
            return maxAmount && goal.current_status > maxAmount
              ? goal.current_status - maxAmount
              : 0;
          }),
        },
      ],
    };
  }, [goalsData, bucketsData, selectedTab]);

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
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6">Goals</Typography>
        </Box>

        {/* Tabs for bucket types */}
        <Tabs
          value={selectedTab}
          onChange={(_event, newValue: BucketType) => setSelectedTab(newValue)}
          sx={{ mb: 2, minHeight: 36 }}
        >
          <Tab label="Expense" value="expense" sx={{ minHeight: 36, py: 1 }} />
          <Tab label="Saving" value="saving" sx={{ minHeight: 36, py: 1 }} />
          <Tab label="Investment" value="investment" sx={{ minHeight: 36, py: 1 }} />
        </Tabs>

        {/* Chart */}
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {error ? (
            <ErrorState
              title="Failed to load bucket goals"
              description="Please try refreshing the page"
            />
          ) : chartData ? (
            <Bar data={chartData} options={barChartOptions} />
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
