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
import { useGetBucketGoalsChartDataQuery } from '../api/dashboardApi';
import { useMemo, useState } from 'react';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { horizontalBarChartOptions } from '../../../shared/utils/chart';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function BucketGoalsChart() {
  const [selectedTab, setSelectedTab] = useState<BucketTypeEnum>('expense');

  const {
    data: chartDataResponse,
    isLoading,
    error,
  } = useGetBucketGoalsChartDataQuery();

  const chartData = useMemo(() => {
    if (!chartDataResponse || chartDataResponse.datasets.length === 0) {
      return null;
    }

    const { labels, bucketTypes, datasets } = chartDataResponse;

    // Filter data by selected bucket type
    const filteredIndices = bucketTypes
      .map((type, index) => (type === selectedTab ? index : -1))
      .filter((index) => index !== -1);

    if (filteredIndices.length === 0) {
      return null;
    }

    const filteredLabels = filteredIndices.map((i) => labels[i]);
    const filteredDatasets = datasets.map((dataset) => ({
      ...dataset,
      data: filteredIndices.map((i) => dataset.data[i]),
      metadata: filteredIndices.map((i) =>
        Array.isArray(dataset.metadata) ? dataset.metadata[i] : dataset.metadata,
      ),
    }));

    // Add Chart.js styling to filtered datasets
    return {
      labels: filteredLabels,
      datasets: [
        // Layer 1: Yellow current (when current < min)
        {
          label: filteredDatasets[0].label,
          data: filteredDatasets[0].data,
          backgroundColor: 'rgba(255, 206, 86, 0.8)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: filteredDatasets[0].metadata,
        },
        // Layer 2: Transparent (min - current) when current < min
        {
          label: filteredDatasets[1].label,
          data: filteredDatasets[1].data,
          backgroundColor: 'rgba(255, 255, 255, 0)',
          borderColor: 'rgba(255, 206, 86, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: filteredDatasets[1].metadata,
        },
        // Layer 3: Green min (when current >= min)
        {
          label: filteredDatasets[2].label,
          data: filteredDatasets[2].data,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: filteredDatasets[2].metadata,
        },
        // Layer 4: Green (current - min) when min <= current <= max
        {
          label: filteredDatasets[3].label,
          data: filteredDatasets[3].data,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: filteredDatasets[3].metadata,
        },
        // Layer 5: Transparent (max - current) when current <= max
        {
          label: filteredDatasets[4].label,
          data: filteredDatasets[4].data,
          backgroundColor: 'rgba(255, 255, 255, 0)',
          borderColor: 'rgba(75, 192, 192, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: filteredDatasets[4].metadata,
        },
        // Layer 6: Red (current - max) when current > max
        {
          label: filteredDatasets[5].label,
          data: filteredDatasets[5].data,
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
          borderColor: 'rgba(255, 99, 132, 0.5)',
          borderWidth: 1,
          barPercentage: 0.9,
          categoryPercentage: 0.9,
          metadata: filteredDatasets[5].metadata,
        },
      ],
    };
  }, [chartDataResponse, selectedTab]);

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
    <>
      <Typography variant="h2" sx={{ p: 1 }}>
        Goals
      </Typography>
      <Card sx={{ height: 500 }}>
        <CardContent
          sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {/* Tabs for bucket types */}
          <Tabs
            value={selectedTab}
            onChange={(_event, newValue: BucketTypeEnum) =>
              setSelectedTab(newValue)
            }
            sx={{ minHeight: 36 }}
          >
            <Tab
              label="Expense"
              value="expense"
              sx={{ minHeight: 36, py: 1 }}
            />
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
    </>
  );
}
