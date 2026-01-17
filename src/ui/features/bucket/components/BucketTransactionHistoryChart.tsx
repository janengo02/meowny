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
import { useMemo } from 'react';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import {
  CHART_COLORS,
  barChartOptions,
  barTotalLabelPlugin,
} from '../../../shared/utils/chart';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { useGetBucketTransactionHistoryChartDataQuery } from '../../dashboard/api/dashboardApi';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface BucketTransactionHistoryChartProps {
  bucketId: number;
  bucketType: BucketTypeEnum;
  mode: 'month' | 'year';
  periodFrom: Dayjs;
  periodTo: Dayjs;
}

export function BucketTransactionHistoryChart({
  bucketId,
  bucketType,
  mode,
  periodFrom,
  periodTo,
}: BucketTransactionHistoryChartProps) {
  const queryParams = useMemo(
    (): GetBucketTransactionHistoryChartDataParams => ({
      bucketId,
      startDate: formatDateForDB(periodFrom),
      endDate: formatDateForDB(periodTo),
      mode,
    }),
    [bucketId, periodFrom, periodTo, mode],
  );

  const {
    data: chartDataResponse,
    isLoading,
    error,
  } = useGetBucketTransactionHistoryChartDataQuery(queryParams);

  const chartData = useMemo(() => {
    if (!chartDataResponse || chartDataResponse.data.length === 0) {
      return null;
    }

    const { labels, data } = chartDataResponse;

    const datasets = [
      {
        label: bucketType === 'expense' ? 'Spent Amount' : 'Contributed Amount',
        data,
        backgroundColor: CHART_COLORS[0].replace('0.8', '0.7'),
        borderColor: CHART_COLORS[0],
        borderWidth: 1,
      },
    ];

    return {
      labels,
      datasets,
    };
  }, [chartDataResponse, bucketType]);

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
          title="Failed to load transaction data"
          description="Please try refreshing the page"
        />
      ) : chartData ? (
        <Bar
          data={chartData}
          options={barChartOptions}
          plugins={[barTotalLabelPlugin]}
        />
      ) : (
        <EmptyState
          icon={
            <ShowChartIcon
              sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.5 }}
            />
          }
          title="No transaction data available"
        />
      )}
    </Box>
  );
}
