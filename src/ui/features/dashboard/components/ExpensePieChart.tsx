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
import { useGetExpenseTransactionsByPeriodQuery } from '../../transaction/api/transactionApi';
import { useMemo, useState, useCallback } from 'react';
import { CHART_COLORS, donutChartOptions } from '../../../shared/utils/chart';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import { formatMoney } from '../../../shared/utils/formatMoney';
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

// Plugin to display total in the center of the donut chart
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart: ChartJS<'doughnut'>) {
    const { ctx, chartArea, data } = chart;

    if (!chartArea) return;

    ctx.save();

    // Calculate total from chart data
    const total = data.datasets.reduce((sum, dataset) => {
      return (
        sum +
        dataset.data.reduce((dataSum, value) => {
          return dataSum + (typeof value === 'number' ? value : 0);
        }, 0)
      );
    }, 0);

    // Calculate center of the actual chart area (excluding legends)
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;

    // Calculate appropriate font sizes based on chart area size
    const chartHeight = chartArea.bottom - chartArea.top;
    const totalFontSize = Math.max(chartHeight / 10, 14);
    const labelFontSize = Math.max(chartHeight / 20, 10);

    // Draw "Total" label on top
    ctx.font = `${labelFontSize}px sans-serif`;
    ctx.fillStyle = '#ddd';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Total', centerX, centerY - totalFontSize / 2);

    // Draw total amount below the label
    ctx.font = `bold ${totalFontSize}px sans-serif`;
    ctx.fillStyle = '#ddd';
    const totalText = formatMoney(total);
    ctx.fillText(totalText, centerX, centerY + labelFontSize);

    ctx.restore();
  },
};

// Custom donut chart options with data labels
const expenseDonutChartOptions = {
  ...donutChartOptions,
  plugins: {
    ...donutChartOptions.plugins,
    datalabels: {
      color: '#fff',
      font: {
        weight: 'bold' as const,
        size: 10,
      },
      formatter: (
        value: number,
        context: { chart: { data: { labels?: string[] } }; dataIndex: number },
      ) => {
        const label = context.chart.data.labels?.[context.dataIndex] || '';
        const formattedAmount = formatMoney(value);
        return `${label}\n${formattedAmount}`;
      },
      display: (context: {
        chart: { data: { datasets: { data: number[] }[] } };
        dataset: { data: number[] };
        dataIndex: number;
      }) => {
        // Only show label if the percentage is greater than 5%
        const total = context.chart.data.datasets[0].data.reduce(
          (acc: number, val: number) => acc + val,
          0,
        );
        const percentage =
          (context.dataset.data[context.dataIndex] / total) * 100;
        return percentage > 5;
      },
    },
  },
} as typeof donutChartOptions;

export function ExpensePieChart() {
  const methods = useForm<ExpensePieChartFormData>({
    defaultValues: {
      targetMonth: dayjs(),
      groupBy: 'bucket',
    },
  });

  const { control } = methods;
  const groupBy = useWatch({ control, name: 'groupBy' });
  const targetMonth = useWatch({ control, name: 'targetMonth' });

  // State for modals
  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Calculate start and end dates for the query
  const queryParams =
    useMemo((): GetExpenseTransactionsByPeriodParams | null => {
      const startDate = formatDateForDB(targetMonth.startOf('month'));
      const endDate = formatDateForDB(targetMonth.endOf('month'));

      return {
        startDate,
        endDate,
      };
    }, [targetMonth]);

  const { data, isLoading, error } = useGetExpenseTransactionsByPeriodQuery(
    queryParams!,
    {
      skip: !queryParams,
    },
  );

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    // Filter out items with zero amounts
    const filteredData = data.filter((item) => item.total_amount > 0);

    if (filteredData.length === 0) {
      return null;
    }

    let groupedData: { name: string; total: number; id: number | null }[];

    if (groupBy === 'category') {
      // Group by category
      const categoryMap = new Map<
        string,
        { total: number; id: number | null }
      >();

      filteredData.forEach((item) => {
        const categoryName = item.category_name || 'Uncategorized';
        const existing = categoryMap.get(categoryName);

        if (existing) {
          existing.total += item.total_amount;
        } else {
          categoryMap.set(categoryName, {
            total: item.total_amount,
            id: item.category_id,
          });
        }
      });

      groupedData = Array.from(categoryMap.entries())
        .map(([name, { total, id }]) => ({ name, total, id }))
        .sort((a, b) => b.total - a.total);
    } else {
      // Group by bucket (default)
      groupedData = filteredData
        .map((item) => ({
          name: item.bucket_name,
          total: item.total_amount,
          id: item.bucket_id,
        }))
        .sort((a, b) => b.total - a.total);
    }

    const labels = groupedData.map((item) => item.name);
    const values = groupedData.map((item) => item.total);
    const ids = groupedData.map((item) => item.id);

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
  }, [data, groupBy]);

  const handlePrevMonth = () => {
    const newMonth = targetMonth.subtract(1, 'month');
    methods.setValue('targetMonth', newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = targetMonth.add(1, 'month');
    methods.setValue('targetMonth', newMonth);
  };

  const handleMonthChange = (newValue: Dayjs | null) => {
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
          setIsCategoryModalOpen(true);
        } else {
          setSelectedBucketId(clickedId);
        }
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
              {/* Month Navigation */}
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton onClick={handlePrevMonth} size="small">
                  <ChevronLeftIcon />
                </IconButton>
                <DatePickerField
                  name="targetMonth"
                  views={['year', 'month']}
                  format="YYYY/MM"
                  onChange={handleMonthChange}
                  size="small"
                  sx={{ width: 140 }}
                />
                <IconButton
                  onClick={handleNextMonth}
                  size="small"
                  disabled={targetMonth.isSame(dayjs(), 'month')}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Stack>

              {/* Group By Dropdown */}
              <Stack>
                <FormSelectField
                  name="groupBy"
                  label="Group By"
                  size="small"
                  options={[
                    { value: 'bucket', label: 'Bucket' },
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
                    key={`donut-chart-${targetMonth.format('YYYY-MM')}`}
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
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </FormProvider>
  );
}
