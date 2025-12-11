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
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { useGetExpenseTransactionsByPeriodQuery } from '../../transaction/api/transactionApi';
import { useMemo, useState } from 'react';
import { CHART_COLORS } from '../../../shared/utils/chart';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import { formatMoney } from '../../../shared/utils/formatMoney';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { FormProvider, useForm } from 'react-hook-form';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const pieChartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        boxWidth: 12,
        padding: 10,
        font: {
          size: 11,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          const label = context.label || '';
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce(
            (acc: number, val) => acc + (val as number),
            0,
          );
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${formatMoney(value)} (${percentage}%)`;
        },
      },
    },
  },
};

type FormData = {
  targetMonth: Dayjs;
};

export function ExpensePieChart() {
  const [targetMonth, setTargetMonth] = useState<Dayjs>(dayjs());

  const methods = useForm<FormData>({
    defaultValues: {
      targetMonth: dayjs(),
    },
  });

  // Calculate start and end dates for the query
  const queryParams = useMemo(():
    | GetExpenseTransactionsByPeriodParams
    | null => {
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

    // Filter out buckets with zero amounts
    const expenseData = data.filter((item) => item.total_amount > 0);

    if (expenseData.length === 0) {
      return null;
    }

    const labels = expenseData.map((item) => item.bucket_name);
    const values = expenseData.map((item) => item.total_amount);

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
    };
  }, [data]);

  const handlePrevMonth = () => {
    const newMonth = targetMonth.subtract(1, 'month');
    setTargetMonth(newMonth);
    methods.setValue('targetMonth', newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = targetMonth.add(1, 'month');
    setTargetMonth(newMonth);
    methods.setValue('targetMonth', newMonth);
  };

  const handleMonthChange = (newValue: Dayjs | null) => {
    if (newValue) {
      setTargetMonth(newValue);
    }
  };

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
            <Typography variant="h6">Expenses</Typography>
          </Box>

          {/* Month Navigation */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{ mb: 2 }}
          >
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

          {/* Chart */}
          <Box sx={{ flex: 1, minHeight: 0, maxHeight: 250, margin: 'auto' }}>
            {error ? (
              <ErrorState
                title="Failed to load expense data"
                description="Please try refreshing the page"
              />
            ) : chartData ? (
              <Pie data={chartData} options={pieChartOptions} />
            ) : (
              <EmptyState
                icon={
                  <AccountBalanceWalletIcon
                    sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }}
                  />
                }
                title="No expense data"
                description="Add expense transactions to see your spending breakdown"
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
