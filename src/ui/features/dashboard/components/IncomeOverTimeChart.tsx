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
  type ChartData,
} from 'chart.js';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import {
  CHART_COLORS,
  barChartOptions,
  barTotalLabelPlugin,
  getCheckpointLabels,
  getCheckpoints,
  getGrossIncomeByCategory,
  getNetIncomeByCategory,
  getGrossIncomeAtCheckpoint,
  getNetIncomeAtCheckpoint,
} from '../../../shared/utils/chart';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { useGetIncomeCategoriesQuery } from '../../income/api/incomeCategoryApi';
import { useGetIncomeHistoriesByPeriodQuery } from '../../income/api/incomeHistoryApi';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  incomeChartFilterSchema,
  type IncomeChartFilterFormData,
  type TabValue,
} from '../schemas/dashboard.schemas';

// Extend dayjs with plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Register Chart.js components (without plugin - it will be added per-instance)
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function IncomeOverTimeChart() {
  const { data: incomeCategories } = useGetIncomeCategoriesQuery();
  const [activeTab, setActiveTab] = useState<TabValue>('gross');

  // Period filter form
  const methods = useForm<IncomeChartFilterFormData>({
    resolver: zodResolver(incomeChartFilterSchema),
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
    };
  }, [periodFrom, periodTo, errors]);

  const {
    data: incomeHistories,
    isLoading: isLoadingHistories,
    error,
  } = useGetIncomeHistoriesByPeriodQuery(queryParams!, {
    skip: !queryParams,
  });

  const chartData = useMemo(() => {
    if (!incomeHistories || incomeHistories.length === 0 || !incomeCategories) {
      return null;
    }

    // Generate time checkpoints based on mode
    const checkpoints = getCheckpoints(periodFrom, periodTo, mode);
    if (checkpoints.length === 0) return null;

    // Format checkpoint labels
    const labels = getCheckpointLabels(checkpoints, mode);

    // Create category name map
    const categoryNameMap = new Map<number, string>();
    incomeCategories.forEach((cat) => {
      categoryNameMap.set(cat.id, cat.name);
    });

    // Get unique categories from income histories
    const uniqueCategoryIds = Array.from(
      new Set(
        incomeHistories
          .filter((h) => h.income_category_id !== null)
          .map((h) => h.income_category_id!),
      ),
    );

    // Create datasets based on active tab
    const datasets: ChartData<'bar'>['datasets'] = [];

    if (activeTab === 'gross') {
      // Gross only - by category
      uniqueCategoryIds.forEach((categoryId, index) => {
        const categoryName = categoryNameMap.get(categoryId) || 'Unknown';
        const color = CHART_COLORS[index % CHART_COLORS.length];

        const data = checkpoints.map((checkpoint) => {
          const categoryMap = getGrossIncomeByCategory(
            incomeHistories,
            checkpoint,
            mode,
          );
          return categoryMap.get(categoryId) || 0;
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

        const data = checkpoints.map((checkpoint) => {
          const categoryMap = getNetIncomeByCategory(
            incomeHistories,
            checkpoint,
            mode,
          );
          return categoryMap.get(categoryId) || 0;
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
      const grossData = checkpoints.map((checkpoint) =>
        getGrossIncomeAtCheckpoint(incomeHistories, checkpoint, mode),
      );

      const netData = checkpoints.map((checkpoint) =>
        getNetIncomeAtCheckpoint(incomeHistories, checkpoint, mode),
      );

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
  }, [
    incomeHistories,
    incomeCategories,
    periodFrom,
    periodTo,
    mode,
    activeTab,
  ]);

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
      <Typography variant="h2" sx={{ p: 1 }}>
        Income Over Time
      </Typography>

      <Card sx={{ height: 500 }}>
        <CardContent
          sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ mb: 4, minHeight: 36 }}
          >
            <Tab label="Gross" value="gross" sx={{ minHeight: 36, py: 1 }} />
            <Tab label="Net" value="net" sx={{ minHeight: 36, py: 1 }} />
            <Tab
              label="Gross vs Net"
              value="comparison"
              sx={{ minHeight: 36, py: 1 }}
            />
          </Tabs>

          {/* Filter controls */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
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
                title="Failed to load income data"
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
