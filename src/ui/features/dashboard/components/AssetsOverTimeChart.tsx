import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { useGetAssetsValueHistoryQuery } from '../../bucket/api/bucketValueHistoryApi';
import { useMemo } from 'react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const COLORS = [
  'rgba(136, 132, 216, 0.8)',
  'rgba(130, 202, 157, 0.8)',
  'rgba(255, 198, 88, 0.8)',
  'rgba(255, 124, 124, 0.8)',
  'rgba(164, 222, 108, 0.8)',
  'rgba(216, 136, 132, 0.8)',
  'rgba(141, 209, 225, 0.8)',
  'rgba(208, 132, 216, 0.8)',
  'rgba(255, 179, 71, 0.8)',
  'rgba(131, 166, 237, 0.8)',
];

export function AssetsOverTimeChart() {
  const { data, isLoading, error } = useGetAssetsValueHistoryQuery();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    // Group data by date and bucket
    const dateMap = new Map<string, Record<string, number>>();
    const bucketNamesSet = new Set<string>();

    data.forEach((item) => {
      // Skip if bucket data is missing
      if (!item.bucket) return;

      const date = new Date(item.recorded_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const bucketName = item.bucket.name;
      bucketNamesSet.add(bucketName);

      if (!dateMap.has(date)) {
        dateMap.set(date, {});
      }

      const dateData = dateMap.get(date)!;
      // Use market_value for the chart (which includes both contributed amount and market gains)
      dateData[bucketName] = item.market_value;
    });

    // Convert to array format and sort by date
    const sortedDates = Array.from(dateMap.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    const bucketNames = Array.from(bucketNamesSet);

    // Create datasets for each bucket
    const datasets = bucketNames.map((bucketName, index) => {
      const color = COLORS[index % COLORS.length];
      return {
        label: bucketName,
        data: sortedDates.map((date) => dateMap.get(date)?.[bucketName] || 0),
        borderColor: color,
        backgroundColor: color.replace('0.8', '0.5'),
        fill: true,
        tension: 0.4,
      };
    });

    return {
      labels: sortedDates,
      datasets,
    };
  }, [data]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '¥' + context.parsed.y.toLocaleString();
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 10,
          },
        },
      },
      y: {
        display: true,
        stacked: true,
        ticks: {
          callback: function (value) {
            return '¥' + Number(value).toLocaleString();
          },
          font: {
            size: 10,
          },
        },
      },
    },
  };

  if (error) {
    return (
      <Card sx={{ height: 300 }}>
        <CardContent>
          <Typography color="error">Failed to load assets data</Typography>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card sx={{ height: 300 }}>
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

  if (!chartData) {
    return (
      <Card sx={{ height: 300 }}>
        <CardContent
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography color="text.secondary">
            No asset history data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: 300 }}>
      <CardContent sx={{ height: '100%', pb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Assets Over Time
        </Typography>
        <Box sx={{ width: '100%', height: 'calc(100% - 40px)' }}>
          <Line data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
}
