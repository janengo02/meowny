import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
} from 'chart.js';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  barChartOptions,
  CHART_COLORS,
  getCheckpointLabels,
  getCheckpoints,
  getNetIncomeAtCheckpoint,
  getAssetContributionAtCheckpoint,
} from '../../../shared/utils/chart';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { useGetIncomeHistoriesByPeriodQuery } from '../../income/api/incomeHistoryApi';
import { useGetAssetsValueHistoryQuery } from '../../bucket/api/bucketValueHistoryApi';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {
  incomeVsSavingsChartFilterSchema,
  type IncomeVsSavingsChartFilterFormData,
} from '../schemas/dashboard.schemas';

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function IncomeVsSavingsChart() {
  // Period filter form
  const methods = useForm<IncomeVsSavingsChartFilterFormData>({
    resolver: zodResolver(incomeVsSavingsChartFilterSchema),
    mode: 'onChange',
    defaultValues: {
      mode: 'month',
      periodFrom: dayjs().startOf('year'),
      periodTo: dayjs().endOf('year'),
    },
  });

  const {
    control,
    formState: { errors },
  } = methods;
  const mode = useWatch({ control, name: 'mode' });
  const periodFrom = useWatch({ control, name: 'periodFrom' });
  const periodTo = useWatch({ control, name: 'periodTo' });

  // Prepare query params
  const queryParams = useMemo(() => {
    // Don't query if there are validation errors
    if (Object.keys(errors).length > 0) return null;

    // Convert period inputs to ISO date strings
    const startDate = formatDateForDB(periodFrom);
    const endDate = formatDateForDB(periodTo);

    return {
      startDate,
      endDate,
    };
  }, [periodFrom, periodTo, errors]);

  const {
    data: incomeHistories,
    isLoading: isLoadingIncome,
    error: incomeError,
  } = useGetIncomeHistoriesByPeriodQuery(queryParams!, {
    skip: !queryParams,
  });

  const {
    data: assetsData,
    isLoading: isLoadingAssets,
    error: assetsError,
  } = useGetAssetsValueHistoryQuery(queryParams!, {
    skip: !queryParams,
  });

  const chartData = useMemo(() => {
    if (Object.keys(errors).length > 0) return null;

    if (!incomeHistories || !assetsData || !assetsData.buckets) {
      return null;
    }

    // Generate time checkpoints based on mode
    const checkpoints = getCheckpoints(periodFrom, periodTo, mode);
    if (checkpoints.length === 0) return null;

    // Format checkpoint labels
    const labels = getCheckpointLabels(checkpoints, mode);

    // Calculate income by checkpoint using utility function
    const incomeData = checkpoints.map((checkpoint) =>
      getNetIncomeAtCheckpoint(incomeHistories, checkpoint, mode),
    );

    // Group all bucket histories by bucket
    const bucketHistoriesMap = new Map<
      number,
      (typeof assetsData.buckets)[0]['history']
    >();
    assetsData.buckets.forEach((bucket) => {
      bucketHistoriesMap.set(bucket.id, bucket.history);
    });

    // Calculate asset contribution by checkpoint using utility function
    const assetContributionData = checkpoints.map((checkpoint, index) => {
      // For the first checkpoint, use the day before periodFrom at 23:59:59
      // For subsequent checkpoints, use the previous checkpoint
      const previousCheckpoint =
        index > 0
          ? checkpoints[index - 1]
          : dayjs(periodFrom).subtract(1, 'day').endOf('day').toDate();

      return getAssetContributionAtCheckpoint(
        bucketHistoriesMap,
        checkpoint,
        previousCheckpoint,
      );
    });

    const datasets: ChartData<'bar'>['datasets'] = [
      {
        label: 'Income',
        data: incomeData,
        backgroundColor: CHART_COLORS[1],
        borderColor: CHART_COLORS[1],
        borderWidth: 1,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Asset Contribution',
        data: assetContributionData,
        backgroundColor: CHART_COLORS[0],
        borderColor: CHART_COLORS[0],
        borderWidth: 1,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ];

    return { labels, datasets };
  }, [incomeHistories, assetsData, periodFrom, periodTo, mode, errors]);

  const isLoading = isLoadingIncome || isLoadingAssets;
  const error = incomeError || assetsError;

  if (isLoading) {
    return (
      <Card sx={{ height: 500 }}>
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
    <FormProvider {...methods}>
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
            <Typography variant="h2">Income vs Savings</Typography>
          </Box>

          {/* Filter controls */}
          <Stack direction="row" spacing={2}>
            <FormSelectField
              name="mode"
              label="View Mode"
              options={[
                { value: 'month', label: 'Monthly' },
                { value: 'year', label: 'Yearly' },
              ]}
              size="small"
              sx={{ minWidth: 120 }}
            />
            <DatePickerField
              name="periodFrom"
              label="From"
              size="small"
              views={mode === 'month' ? ['year', 'month'] : ['year']}
            />
            <DatePickerField
              name="periodTo"
              label="To"
              size="small"
              views={mode === 'month' ? ['year', 'month'] : ['year']}
            />
          </Stack>

          {/* Chart */}
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {error ? (
              <ErrorState
                title="Failed to load data"
                description="Please try refreshing the page"
              />
            ) : chartData ? (
              <Bar data={chartData} options={barChartOptions} />
            ) : (
              <EmptyState
                icon={
                  <CompareArrowsIcon
                    sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }}
                  />
                }
                title="No data available"
                description="Add income and asset transactions to see your income vs savings"
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
