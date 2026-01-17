import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs, { type Dayjs } from 'dayjs';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartEvent,
  type ActiveElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useGetExpensePieChartDataQuery } from '../api/dashboardApi';
import { useMemo, useState, useCallback } from 'react';
import {
  centerTextPlugin,
  CHART_COLORS,
  expenseDonutChartOptions,
} from '../../../shared/utils/chart';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import type { ExpensePieChartFormData } from '../schemas/dashboard.schemas';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { BucketModal } from '../../bucket/components/BucketModal';
import { ExpenseCategoryModal } from '../../bucket/components/ExpenseCategoryModal';

// Register Chart.js components (excluding ChartDataLabels - applied per-chart)
ChartJS.register(ArcElement, Tooltip, Legend);

export function ExpensePieChart() {
  const methods = useForm<ExpensePieChartFormData>({
    defaultValues: {
      mode: 'month',
      targetMonth: dayjs().subtract(1, 'month'),
      groupBy: 'bucket',
    },
  });

  const { control } = methods;
  const mode = useWatch({ control, name: 'mode' });
  const groupBy = useWatch({ control, name: 'groupBy' });
  const targetMonth = useWatch({ control, name: 'targetMonth' });

  // State for modals
  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );

  // Calculate start and end dates for the query
  const queryParams = useMemo((): GetExpensePieChartDataParams | null => {
    const startDate = formatDateForDB(targetMonth.startOf(mode));
    const endDate = formatDateForDB(targetMonth.endOf(mode));

    return {
      startDate,
      endDate,
      groupBy,
    };
  }, [targetMonth, mode, groupBy]);

  const {
    data: chartDataResponse,
    isLoading,
    error,
  } = useGetExpensePieChartDataQuery(queryParams!, {
    skip: !queryParams,
  });

  const chartData = useMemo(() => {
    if (!chartDataResponse || chartDataResponse.labels.length === 0) {
      return null;
    }

    const { labels, values, ids } = chartDataResponse;

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: CHART_COLORS.map((color) =>
            color.replace('0.8', '0.7'),
          ),
          borderColor: CHART_COLORS,
          borderWidth: 1,
        },
      ],
      // Store IDs for click handling
      metadata: { ids, groupBy },
    };
  }, [chartDataResponse, groupBy]);

  const handlePrevPeriod = () => {
    const newPeriod = targetMonth.subtract(1, mode);
    methods.setValue('targetMonth', newPeriod);
  };

  const handleNextPeriod = () => {
    const newPeriod = targetMonth.add(1, mode);
    methods.setValue('targetMonth', newPeriod);
  };

  const handlePeriodChange = (newValue: Dayjs | null) => {
    if (newValue) {
      methods.setValue('targetMonth', newValue);
    }
  };

  // Handle click on chart segments
  const handleChartClick = useCallback(
    (_event: ChartEvent, elements: ActiveElement[]) => {
      if (elements.length > 0 && chartData) {
        const elementIndex = elements[0].index;
        const { ids, groupBy: currentGroupBy } = chartData.metadata as {
          ids: (number | null)[];
          groupBy: string;
        };
        const clickedId = ids[elementIndex];

        if (currentGroupBy === 'category') {
          setSelectedCategoryId(clickedId);
        } else if (currentGroupBy === 'bucket') {
          setSelectedBucketId(clickedId);
        }
        // For 'account' groupBy, we don't open any modal
      }
    },
    [chartData],
  );

  // Create chart options with click handler
  const chartOptions = useMemo(
    () => ({
      ...expenseDonutChartOptions,
      onClick: handleChartClick,
    }),
    [handleChartClick],
  );

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
      <Box display="flex" flexDirection="column" height="100%">
        <Typography variant="h2" sx={{ p: 1 }}>
          Expenses
        </Typography>
        <Card sx={{ height: '100%', minHeight: 500 }}>
          <CardContent
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {/* Controls */}
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              {/* Left side: Mode and Period Navigation */}
              <Stack direction="row" spacing={2} alignItems="center">
                {/* Mode Select */}
                <FormSelectField
                  name="mode"
                  label="View Mode"
                  size="small"
                  options={[
                    { value: 'month', label: 'Monthly' },
                    { value: 'year', label: 'Yearly' },
                  ]}
                  sx={{ minWidth: 120 }}
                />

                {/* Period Navigation */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton onClick={handlePrevPeriod} size="small">
                    <ChevronLeftIcon />
                  </IconButton>
                  <DatePickerField
                    name="targetMonth"
                    views={mode === 'month' ? ['year', 'month'] : ['year']}
                    format={mode === 'month' ? 'YYYY/MM' : 'YYYY'}
                    onChange={handlePeriodChange}
                    size="small"
                    sx={{ width: 140 }}
                  />
                  <IconButton
                    onClick={handleNextPeriod}
                    size="small"
                    disabled={targetMonth.isSame(dayjs(), mode)}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Right side: Group By Dropdown */}
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
            <Box
              sx={{
                flex: 1,
                width: '100%',
                height: '100%',
                margin: 'auto 0',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {error ? (
                <ErrorState
                  title="Failed to load expense data"
                  description="Please try refreshing the page"
                />
              ) : chartData ? (
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Doughnut
                    key={`donut-chart-${mode}-${targetMonth.format(mode === 'month' ? 'YYYY-MM' : 'YYYY')}`}
                    data={chartData}
                    options={chartOptions}
                    plugins={[centerTextPlugin, ChartDataLabels]}
                  />
                </Box>
              ) : (
                <EmptyState
                  icon={
                    <AccountBalanceWalletIcon
                      sx={{
                        fontSize: 48,
                        color: 'text.disabled',
                        opacity: 0.5,
                      }}
                    />
                  }
                  title="No expense data"
                  description="Add expense transactions to see your spending breakdown"
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Modals */}
      <BucketModal
        bucketId={selectedBucketId}
        open={selectedBucketId !== null}
        onClose={() => setSelectedBucketId(null)}
      />
      <ExpenseCategoryModal
        categoryId={selectedCategoryId}
        open={selectedCategoryId !== null}
        onClose={() => setSelectedCategoryId(null)}
      />
    </FormProvider>
  );
}
