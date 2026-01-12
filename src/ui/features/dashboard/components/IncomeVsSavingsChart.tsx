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
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { barChartOptions, CHART_COLORS } from '../../../shared/utils/chart';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { useGetIncomeVsSavingsChartDataQuery } from '../api/dashboardApi';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {
  incomeVsSavingsChartFilterSchema,
  type IncomeVsSavingsChartFilterFormData,
} from '../schemas/dashboard.schemas';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function IncomeVsSavingsChart() {
  // Period filter form
  const methods = useForm<IncomeVsSavingsChartFilterFormData>({
    resolver: zodResolver(incomeVsSavingsChartFilterSchema),
    mode: 'onChange',
    defaultValues: {
      mode: 'month',
      periodFrom: dayjs().subtract(12, 'month').startOf('month'),
      periodTo: dayjs().subtract(1, 'month').endOf('month'),
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
      mode,
    };
  }, [periodFrom, periodTo, mode, errors]);

  const {
    data: chartDataResponse,
    isLoading,
    error,
  } = useGetIncomeVsSavingsChartDataQuery(queryParams!, {
    skip: !queryParams,
  });

  const chartData = useMemo(() => {
    if (!chartDataResponse) return null;

    const { labels, incomeData, expenseData, assetContributionData } =
      chartDataResponse;

    if (labels.length === 0) return null;

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
        label: 'Expense',
        data: expenseData,
        backgroundColor: CHART_COLORS[3],
        borderColor: CHART_COLORS[3],
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
  }, [chartDataResponse]);

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
      <Typography variant="h2" sx={{ p: 1 }}>
        Income, Expenses & Savings
      </Typography>
      <Card sx={{ height: 500, pt: 1 }}>
        <CardContent
          sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
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
              format={mode === 'month' ? 'YYYY/MM' : 'YYYY'}
            />
            <DatePickerField
              name="periodTo"
              label="To"
              size="small"
              views={mode === 'month' ? ['year', 'month'] : ['year']}
              format={mode === 'month' ? 'YYYY/MM' : 'YYYY'}
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
                description="Add income, expense, and asset transactions to see your financial overview"
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
