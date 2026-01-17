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
} from 'chart.js';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CHART_COLORS,
  barChartOptions,
  barTotalLabelPlugin,
} from '../../../shared/utils/chart';
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
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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

  const chartData = useMemo(() => {
    if (!chartDataResponse) {
      return null;
    }

    const { labels, grossByCategory, netByCategory, grossTotal, netTotal } =
      chartDataResponse;

    // Select datasets based on active tab
    let datasets: { label: string; data: number[] }[] = [];

    if (activeTab === 'gross') {
      datasets = grossByCategory;
    } else if (activeTab === 'net') {
      datasets = netByCategory;
    } else {
      // Comparison view
      datasets = [
        { label: 'Gross', data: grossTotal },
        { label: 'Net', data: netTotal },
      ];
    }

    if (datasets.length === 0) {
      return null;
    }

    // Add Chart.js styling to datasets
    const styledDatasets = datasets.map((dataset, index) => {
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

    return { labels, datasets: styledDatasets };
  }, [chartDataResponse, activeTab]);

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
