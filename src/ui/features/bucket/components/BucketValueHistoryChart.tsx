import { Box, CircularProgress } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import type { Dayjs } from 'dayjs';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useGetBucketValueHistoriesByBucketQuery } from '../api/bucketValueHistoryApi';
import { useMemo } from 'react';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import {
  CHART_COLORS,
  getCheckpointLabels,
  getCheckpoints,
  getHistoryAtCheckpoint,
  barTotalWithReturnPlugin,
  barStackedChartForGainLossDefaultOptions,
  barTotalLabelPlugin,
  barChartOptions,
} from '../../../shared/utils/chart';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface BucketValueHistoryChartProps {
  bucketId: number;
  bucketType: BucketTypeEnum;
  mode: 'month' | 'year';
  periodFrom: Dayjs;
  periodTo: Dayjs;
}

export function BucketValueHistoryChart({
  bucketId,
  bucketType,
  mode,
  periodFrom,
  periodTo,
}: BucketValueHistoryChartProps) {
  // Query parameters for the API
  const queryParams = useMemo(
    () => ({
      bucketId,
      startDate: formatDateForDB(periodFrom),
      endDate: formatDateForDB(periodTo),
    }),
    [bucketId, periodFrom, periodTo],
  );

  const { data, isLoading, error } = useGetBucketValueHistoriesByBucketQuery(
    queryParams!,
    {
      skip: !queryParams,
    },
  );

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    const checkpoints = getCheckpoints(periodFrom, periodTo, mode);
    if (checkpoints.length === 0) return null;

    // Format checkpoint labels
    const labels = getCheckpointLabels(checkpoints, mode);

    // Calculate contributed amount and gains/losses for each checkpoint
    const contributedAmounts: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    checkpoints.forEach((checkpoint) => {
      const historyAtCheckpoint = getHistoryAtCheckpoint(data, checkpoint);
      const contributedAmount = historyAtCheckpoint?.contributed_amount || 0;
      const marketValue = historyAtCheckpoint?.market_value || 0;
      const gainLoss = marketValue - contributedAmount;

      contributedAmounts.push(contributedAmount);

      // Separate gains and losses for color coding
      if (gainLoss >= 0) {
        gains.push(gainLoss);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(gainLoss); // This will be negative
      }
    });

    // Build datasets - only show Gains/Losses for investment buckets
    const datasets = [
      {
        label: 'Contributed Balance',
        data: contributedAmounts,
        backgroundColor: CHART_COLORS[0].replace('0.8', '0.7'),
        borderColor: CHART_COLORS[0],
        borderWidth: 1,
      },
    ];

    // Only add Gains and Losses datasets for investment buckets
    if (bucketType === 'investment') {
      datasets.push(
        {
          label: 'Gains',
          data: gains,
          backgroundColor: 'rgba(76, 175, 80, 0.7)', // Green
          borderColor: 'rgba(76, 175, 80, 0.8)',
          borderWidth: 1,
        },
        {
          label: 'Losses',
          data: losses,
          backgroundColor: 'rgba(244, 67, 54, 0.7)', // Red
          borderColor: 'rgba(244, 67, 54, 0.8)',
          borderWidth: 1,
        },
      );
    }

    return {
      labels,
      datasets,
    };
  }, [data, mode, periodFrom, periodTo, bucketType]);

  if (isLoading) {
    return (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      {error ? (
        <ErrorState
          title="Failed to load performance data"
          description="Please try refreshing the page"
        />
      ) : chartData ? (
        <Bar
          data={chartData}
          options={
            bucketType === 'saving'
              ? barChartOptions
              : barStackedChartForGainLossDefaultOptions
          }
          plugins={[
            bucketType === 'saving'
              ? barTotalLabelPlugin
              : barTotalWithReturnPlugin,
          ]}
        />
      ) : (
        <EmptyState
          icon={
            <ShowChartIcon
              sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.5 }}
            />
          }
          title="No performance data available"
        />
      )}
    </Box>
  );
}
