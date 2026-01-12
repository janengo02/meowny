import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Stack,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import dayjs from 'dayjs';
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
import { useGetAssetsOverTimeChartDataQuery } from '../api/dashboardApi';
import { useMemo } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import {
  CHART_COLORS,
  lineStackedChartDefaultOptions,
  totalLabelPlugin,
} from '../../../shared/utils/chart';
import {
  chartFilterSchema,
  type ChartFilterFormData,
} from '../schemas/dashboard.schemas';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { formatDateForDB } from '../../../shared/utils/dateTime';

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

export function AssetsOverTimeChart() {
  const methods = useForm<ChartFilterFormData>({
    resolver: zodResolver(chartFilterSchema),
    mode: 'onChange',
    defaultValues: {
      mode: 'month',
      periodFrom: dayjs().subtract(12, 'month').startOf('month'),
      periodTo: dayjs().subtract(1, 'month').endOf('month'),
      groupBy: 'bucket',
    },
  });

  const {
    control,
    setValue,
    formState: { errors },
  } = methods;

  const mode = useWatch({ control, name: 'mode' });
  const periodFrom = useWatch({ control, name: 'periodFrom' });
  const periodTo = useWatch({ control, name: 'periodTo' });
  const groupBy = useWatch({ control, name: 'groupBy' });

  // Prepare query params
  const queryParams = useMemo((): GetAssetsOverTimeChartDataParams | null => {
    // Don't query if there are validation errors
    if (Object.keys(errors).length > 0) return null;

    // Convert period inputs to ISO date strings
    const startDate = formatDateForDB(periodFrom);
    const endDate = formatDateForDB(periodTo);

    return {
      startDate,
      endDate,
      mode,
      groupBy,
    };
  }, [periodFrom, periodTo, mode, groupBy, errors]);

  const {
    data: chartDataResponse,
    isLoading,
    error,
  } = useGetAssetsOverTimeChartDataQuery(queryParams!, {
    skip: !queryParams,
  });

  const chartData = useMemo(() => {
    if (!chartDataResponse || chartDataResponse.datasets.length === 0) {
      return null;
    }

    const { labels, datasets } = chartDataResponse;

    // Add Chart.js styling to datasets
    const styledDatasets = datasets.map((dataset, index) => {
      const color = CHART_COLORS[index % CHART_COLORS.length];
      return {
        label: dataset.label,
        data: dataset.data,
        borderColor: color,
        backgroundColor: color.replace('0.8', '0.5'),
        fill: true,
        tension: 0, // Straight lines
      };
    });

    return {
      labels,
      datasets: styledDatasets,
    };
  }, [chartDataResponse]);

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

  return (
    <FormProvider {...methods}>
      <Typography variant="h2" sx={{ p: 1 }}>
        Assets Over Time
      </Typography>
      <Card sx={{ pt: 1 }}>
        <CardContent>
          {/* Controls */}
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2}>
              {/* Mode Select */}
              <FormSelectField
                name="mode"
                label="View Mode"
                size="small"
                options={[
                  { value: 'month', label: 'Month' },
                  { value: 'year', label: 'Year' },
                ]}
                onChange={(e) => {
                  const newMode = e.target.value as 'month' | 'year';
                  setValue('mode', newMode);
                  // Adjust periodFrom and periodTo to fit the new mode
                  setValue('periodFrom', periodFrom.startOf(newMode));
                  setValue('periodTo', periodTo.endOf(newMode));
                }}
              />

              {/* Period Filters */}
              <DatePickerField
                name="periodFrom"
                label="From"
                views={mode === 'month' ? ['year', 'month'] : ['year']}
                maxDate={dayjs().endOf(mode === 'month' ? 'month' : 'year')}
                format={mode === 'month' ? 'YYYY/MM' : 'YYYY'}
                onChange={(newValue) => {
                  if (newValue) {
                    setValue('periodFrom', newValue.startOf(mode), {
                      shouldValidate: true,
                    });
                  }
                }}
              />
              <Typography variant="caption" sx={{ mx: 1, pt: 1 }}>
                -
              </Typography>
              <DatePickerField
                name="periodTo"
                label="To"
                views={mode === 'month' ? ['month', 'year'] : ['year']}
                maxDate={dayjs().endOf(mode === 'month' ? 'month' : 'year')}
                format={mode === 'month' ? 'YYYY/MM' : 'YYYY'}
                onChange={(newValue) => {
                  if (newValue) {
                    setValue('periodTo', newValue.endOf(mode), {
                      shouldValidate: true,
                    });
                  }
                }}
              />
            </Stack>
            <Stack>
              <FormSelectField
                name="groupBy"
                label="Group By"
                size="small"
                options={[
                  { value: 'bucket', label: 'Bucket' },
                  { value: 'account', label: 'Account' },
                  { value: 'category', label: 'Category' },
                ]}
              />
            </Stack>
          </Stack>

          {/* Chart */}
          <Box sx={{ width: '100%', height: 400 }}>
            {error ? (
              <ErrorState
                title="Failed to load assets data"
                description="Please try refreshing the page"
              />
            ) : chartData ? (
              <Line
                data={chartData}
                options={lineStackedChartDefaultOptions}
                plugins={[totalLabelPlugin]}
              />
            ) : (
              <EmptyState
                icon={
                  <ShowChartIcon
                    sx={{ fontSize: 64, color: 'text.disabled', opacity: 0.5 }}
                  />
                }
                title="No asset history data available"
                description="Add transactions to see your assets over time"
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
