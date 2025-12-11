import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import { formatMoney } from '../../../shared/utils/formatMoney';
import { CHART_COLORS, barTotalLabelPlugin } from '../../../shared/utils/chart';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { useGetIncomeCategoriesQuery } from '../../income/api/incomeCategoryApi';
import { useGetIncomeTaxesQuery } from '../../income/api/incomeTaxApi';
import { useGetIncomeHistoriesByPeriodQuery } from '../../income/api/incomeHistoryApi';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, barTotalLabelPlugin);

// Form schema
const incomeChartFilterSchema = z
  .object({
    mode: z.enum(['month', 'year']),
    periodFrom: z.custom<Dayjs>((val) => val !== null && val !== undefined),
    periodTo: z.custom<Dayjs>((val) => val !== null && val !== undefined),
  })
  .refine(
    (data) =>
      data.periodFrom.isBefore(data.periodTo) ||
      data.periodFrom.isSame(data.periodTo),
    {
      message: 'Start date must be before or equal to end date',
      path: ['periodTo'],
    },
  );

type IncomeChartFilterFormData = z.infer<typeof incomeChartFilterSchema>;

const barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 25,
    },
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: {
        callback: function (value) {
          return formatMoney(value as number);
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
          const value = context.parsed.y || 0;
          // Skip showing zero values in tooltip
          if (value === 0) {
            return undefined;
          }
          const datasetLabel = context.dataset.label || '';
          return `${datasetLabel}: ${formatMoney(value)}`;
        },
      },
      filter: function (tooltipItem) {
        // Filter out zero values from tooltip
        return tooltipItem.parsed.y !== 0;
      },
    },
  },
};

type TabValue = 'gross' | 'net' | 'comparison';

export function IncomeOverTimeChart() {
  const { data: incomeCategories } = useGetIncomeCategoriesQuery();
  const { data: incomeTaxes } = useGetIncomeTaxesQuery();
  const [activeTab, setActiveTab] = useState<TabValue>('gross');

  // Period filter form
  const methods = useForm<IncomeChartFilterFormData>({
    resolver: zodResolver(incomeChartFilterSchema),
    mode: 'onChange',
    defaultValues: {
      mode: 'month',
      periodFrom: dayjs().startOf('year'),
      periodTo: dayjs().endOf('year'),
    },
  });

  const { control } = methods;
  const mode = useWatch({ control, name: 'mode' });
  const periodFrom = useWatch({ control, name: 'periodFrom' });
  const periodTo = useWatch({ control, name: 'periodTo' });

  // Query params for filtered income histories
  const queryParams = useMemo(
    () => ({
      startDate: formatDateForDB(periodFrom),
      endDate: formatDateForDB(periodTo),
    }),
    [periodFrom, periodTo],
  );

  const { data: incomeHistories, isLoading: isLoadingHistories, error } =
    useGetIncomeHistoriesByPeriodQuery(queryParams);

  const chartData = useMemo(() => {
    if (!incomeHistories || incomeHistories.length === 0 || !incomeCategories || !incomeTaxes) {
      return null;
    }

    // Generate time checkpoints based on mode
    const checkpoints: Dayjs[] = [];
    let current = periodFrom.startOf(mode);
    const end = periodTo.endOf(mode);

    while (current.isSameOrBefore(end, mode)) {
      checkpoints.push(current);
      current = current.add(1, mode);
    }

    // Create category color map
    const categoryNameMap = new Map<number, string>();
    incomeCategories.forEach((cat) => {
      categoryNameMap.set(cat.id, cat.name);
    });

    // Get unique categories from income histories
    const uniqueCategoryIds = Array.from(
      new Set(
        incomeHistories
          .filter((h) => h.income_category_id !== null)
          .map((h) => h.income_category_id!)
      )
    );

    // Calculate gross and net amounts by checkpoint and category
    const grossByCheckpointCategory = new Map<string, Map<number, number>>();
    const netByCheckpointCategory = new Map<string, Map<number, number>>();
    const totalGrossByCheckpoint = new Map<string, number>();
    const totalNetByCheckpoint = new Map<string, number>();

    checkpoints.forEach((checkpoint) => {
      const key = checkpoint.format('YYYY-MM-DD');
      grossByCheckpointCategory.set(key, new Map());
      netByCheckpointCategory.set(key, new Map());
      totalGrossByCheckpoint.set(key, 0);
      totalNetByCheckpoint.set(key, 0);
    });

    incomeHistories.forEach((history) => {
      const receivedDate = dayjs(history.received_date);
      const checkpoint = checkpoints.find((cp) => receivedDate.isSame(cp, mode));

      if (!checkpoint || history.income_category_id === null) return;

      const checkpointKey = checkpoint.format('YYYY-MM-DD');
      const categoryId = history.income_category_id;

      // Add gross amount
      const grossMap = grossByCheckpointCategory.get(checkpointKey)!;
      grossMap.set(categoryId, (grossMap.get(categoryId) || 0) + history.gross_amount);
      totalGrossByCheckpoint.set(checkpointKey, totalGrossByCheckpoint.get(checkpointKey)! + history.gross_amount);

      // Calculate net amount (gross - taxes for this history)
      const historyTaxes = incomeTaxes.filter((tax) => tax.income_history_id === history.id);
      const totalTax = historyTaxes.reduce((sum, tax) => sum + tax.tax_amount, 0);
      const netAmount = history.gross_amount - totalTax;

      const netMap = netByCheckpointCategory.get(checkpointKey)!;
      netMap.set(categoryId, (netMap.get(categoryId) || 0) + netAmount);
      totalNetByCheckpoint.set(checkpointKey, totalNetByCheckpoint.get(checkpointKey)! + netAmount);
    });

    // Create labels for checkpoints
    const labels = checkpoints.map((cp) =>
      mode === 'month' ? cp.format('MMM YYYY') : cp.format('YYYY')
    );

    // Create datasets based on active tab
    const datasets: ChartData<'bar'>['datasets'] = [];

    if (activeTab === 'gross') {
      // Gross only - by category
      uniqueCategoryIds.forEach((categoryId, index) => {
        const categoryName = categoryNameMap.get(categoryId) || 'Unknown';
        const color = CHART_COLORS[index % CHART_COLORS.length];

        const data = checkpoints.map((cp) => {
          const checkpointKey = cp.format('YYYY-MM-DD');
          return grossByCheckpointCategory.get(checkpointKey)?.get(categoryId) || 0;
        });

        // Only add dataset if it has non-zero values
        const hasNonZeroValues = data.some((value) => value > 0);
        if (hasNonZeroValues) {
          datasets.push({
            label: categoryName,
            data,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
            stack: 'stack',
            barPercentage: 0.6,
            categoryPercentage: 0.8,
          });
        }
      });
    } else if (activeTab === 'net') {
      // Net only - by category
      uniqueCategoryIds.forEach((categoryId, index) => {
        const categoryName = categoryNameMap.get(categoryId) || 'Unknown';
        const color = CHART_COLORS[index % CHART_COLORS.length];

        const data = checkpoints.map((cp) => {
          const checkpointKey = cp.format('YYYY-MM-DD');
          return netByCheckpointCategory.get(checkpointKey)?.get(categoryId) || 0;
        });

        // Only add dataset if it has non-zero values
        const hasNonZeroValues = data.some((value) => value > 0);
        if (hasNonZeroValues) {
          datasets.push({
            label: categoryName,
            data,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
            stack: 'stack',
            barPercentage: 0.6,
            categoryPercentage: 0.8,
          });
        }
      });
    } else {
      // Comparison - total gross vs net (not by category)
      const grossData = checkpoints.map((cp) => {
        const checkpointKey = cp.format('YYYY-MM-DD');
        return totalGrossByCheckpoint.get(checkpointKey) || 0;
      });

      const netData = checkpoints.map((cp) => {
        const checkpointKey = cp.format('YYYY-MM-DD');
        return totalNetByCheckpoint.get(checkpointKey) || 0;
      });

      datasets.push({
        label: 'Gross',
        data: grossData,
        backgroundColor: CHART_COLORS[0].replace('0.8', '0.5'),
        borderColor: CHART_COLORS[0],
        borderWidth: 1,
        stack: 'stack',
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      });

      datasets.push({
        label: 'Net',
        data: netData,
        backgroundColor: CHART_COLORS[1],
        borderColor: CHART_COLORS[1],
        borderWidth: 1,
        stack: 'stack',
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      });
    }

    return { labels, datasets };
  }, [incomeHistories, incomeCategories, incomeTaxes, periodFrom, periodTo, mode, activeTab]);

  const isLoading = isLoadingHistories;

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
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="h6">Income Over Time</Typography>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 2, minHeight: 36 }}
          >
            <Tab label="Gross" value="gross" sx={{ minHeight: 36, py: 1 }} />
            <Tab label="Net" value="net" sx={{ minHeight: 36, py: 1 }} />
            <Tab label="Gross vs Net" value="comparison" sx={{ minHeight: 36, py: 1 }} />
          </Tabs>

          {/* Filter controls */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
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
                title="Failed to load income data"
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
                title="No income data"
                description="Add income history entries to see your income over time"
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
