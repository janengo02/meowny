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
import { Bar, Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartDataset,
} from 'chart.js';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CHART_COLORS,
  stackedBarChartOptions,
  stackedBarTotalLabelPlugin,
} from '../../../shared/utils/chart';
import { formatMoney } from '../../../shared/utils/formatMoney';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import { useGetIncomeOverTimeChartDataQuery } from '../api/dashboardApi';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  incomeChartFilterSchema,
  type IncomeChartFilterFormData,
  type TabValue,
} from '../schemas/dashboard.schemas';

// Register Chart.js components (without plugin - it will be added per-instance)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

export function IncomeOverTimeChart() {
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
  const queryParams = useMemo((): GetIncomeOverTimeChartDataParams | null => {
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
  } = useGetIncomeOverTimeChartDataQuery(queryParams!, {
    skip: !queryParams,
  });

  // Chart data for bar charts (Gross and Net tabs)
  const barChartData = useMemo(() => {
    if (!chartDataResponse || activeTab === 'tax') {
      return null;
    }

    const { labels, grossByCategory, netByCategory } = chartDataResponse;
    const sourceData = activeTab === 'gross' ? grossByCategory : netByCategory;

    const datasets = sourceData.map((dataset, index) => {
      const color = CHART_COLORS[index % CHART_COLORS.length];
      return {
        label: dataset.label,
        data: dataset.data,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        stack: 'stack',
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      };
    });

    return datasets.length > 0 ? { labels, datasets } : null;
  }, [chartDataResponse, activeTab]);

  // Chart data for mixed chart (Tax tab)
  const mixedChartData = useMemo((): ChartData<'bar'> | null => {
    if (!chartDataResponse || activeTab !== 'tax') {
      return null;
    }

    const { labels, taxByCategory, taxTotalPercentage } = chartDataResponse;

    const datasets: ChartData<'bar'>['datasets'] = [];
    for (let index = 0; index < taxByCategory.length; index++) {
      const dataset = taxByCategory[index];
      const color = CHART_COLORS[index % CHART_COLORS.length];
      datasets.push({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        stack: 'stack',
        barPercentage: 0.6,
        categoryPercentage: 0.8,
        type: 'bar' as const,
        yAxisID: 'y',
      });
    }
    // Add line dataset - cast through unknown for mixed chart type compatibility
    datasets.push({
      label: 'Tax %',
      data: taxTotalPercentage,
      borderColor: '#FF6384',
      backgroundColor: '#FF6384',
      borderWidth: 2,
      type: 'line',
      yAxisID: 'y1',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
    } as unknown as ChartDataset<'bar'>);

    return datasets.length > 0 ? { labels, datasets } : null;
  }, [chartDataResponse, activeTab]);

  // Create chart options based on active tab
  const chartOptions = useMemo(() => {
    if (activeTab === 'tax') {
      // Combo chart options with dual y-axes
      return {
        ...stackedBarChartOptions,
        scales: {
          x: {
            stacked: true,
          },
          y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            stacked: true,
            beginAtZero: true,
            ticks: {
              callback: function (value: number | string) {
                return formatMoney(value as number);
              },
            },
          },
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              callback: function (value: number | string) {
                return `${value}%`;
              },
            },
          },
        },
        plugins: {
          ...stackedBarChartOptions.plugins,
          tooltip: {
            ...stackedBarChartOptions.plugins?.tooltip,
            callbacks: {
              beforeBody: function (tooltipItems) {
                // Find the Tax % dataset
                const taxPercentItem = tooltipItems.find(
                  (item) => item.dataset.label === 'Tax %',
                );
                if (taxPercentItem && taxPercentItem.parsed.y !== null) {
                  const value = taxPercentItem.parsed.y;
                  return [`Tax %: ${value.toFixed(2)}%`, ''];
                }
                return [];
              },
              label: function (context) {
                const datasetLabel = context.dataset.label || '';
                const value = context.parsed.y;

                // Skip the Tax % in the regular label section since it's in beforeBody
                if (datasetLabel === 'Tax %') {
                  return undefined;
                }

                if (value === null || value === undefined) {
                  return `${datasetLabel}: N/A`;
                }

                // For tax category bars, show money format
                return `${datasetLabel}: ${formatMoney(value)}`;
              },
            },
          },
        },
      };
    }
    return stackedBarChartOptions;
  }, [activeTab]);

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
            <Tab label="Tax" value="tax" sx={{ minHeight: 36, py: 1 }} />
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
            ) : activeTab === 'tax' && mixedChartData ? (
              <Chart
                type="bar"
                data={mixedChartData}
                options={chartOptions}
                plugins={[stackedBarTotalLabelPlugin]}
              />
            ) : barChartData ? (
              <Bar
                data={barChartData}
                options={chartOptions}
                plugins={[stackedBarTotalLabelPlugin]}
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
