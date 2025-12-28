import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import dayjs from 'dayjs';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useGetExpenseTransactionsByCategoryAndPeriodQuery } from '../../transaction/api/transactionApi';
import { useMemo } from 'react';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import {
  CHART_COLORS,
  getCheckpointLabels,
  getCheckpoints,
  getExpenseAtCheckpoint,
  barChartOptions,
  barTotalLabelPlugin,
} from '../../../shared/utils/chart';
import { ErrorState } from '../../../shared/components/layout/ErrorState';
import { EmptyState } from '../../../shared/components/layout/EmptyState';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useAppSelector } from '../../../store/hooks';
import { selectCategoryById } from '../../account/selectors/accountSelectors';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  bucketChartFilterSchema,
  type BucketChartFilterFormData,
} from '../schemas/bucket.schemas';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface ExpenseCategoryModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: number;
}

export function ExpenseCategoryModal({
  open,
  onClose,
  categoryId,
}: ExpenseCategoryModalProps) {
  const category = useAppSelector((state) =>
    selectCategoryById(state, categoryId),
  );

  const methods = useForm<BucketChartFilterFormData>({
    resolver: zodResolver(bucketChartFilterSchema),
    mode: 'onChange',
    defaultValues: {
      mode: 'month',
      periodFrom: dayjs().startOf('year'),
      periodTo: dayjs().endOf('year'),
    },
  });

  const { control, setValue } = methods;
  const mode = useWatch({ control, name: 'mode' });
  const periodFrom = useWatch({ control, name: 'periodFrom' });
  const periodTo = useWatch({ control, name: 'periodTo' });

  const queryParams = useMemo(
    () => ({
      categoryId,
      startDate: formatDateForDB(periodFrom),
      endDate: formatDateForDB(periodTo),
    }),
    [categoryId, periodFrom, periodTo],
  );

  const {
    data: transactions,
    isLoading,
    error,
  } = useGetExpenseTransactionsByCategoryAndPeriodQuery(queryParams);

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return null;
    }

    const checkpoints = getCheckpoints(periodFrom, periodTo, mode);
    if (checkpoints.length === 0) return null;

    // Format checkpoint labels
    const labels = getCheckpointLabels(checkpoints, mode);

    // Calculate transaction sums for each checkpoint
    // Sum all expense transactions within each checkpoint period
    const transactionSums = checkpoints.map((checkpoint) =>
      getExpenseAtCheckpoint(transactions, checkpoint, mode),
    );

    const datasets = [
      {
        label: 'Spent Amount',
        data: transactionSums,
        backgroundColor: CHART_COLORS[0].replace('0.8', '0.7'),
        borderColor: CHART_COLORS[0],
        borderWidth: 1,
      },
    ];

    return {
      labels,
      datasets,
    };
  }, [transactions, mode, periodFrom, periodTo]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {category?.name || 'Category'} - Transaction History
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {/* Period Filter Controls */}
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

            {/* Chart */}
            <Box sx={{ width: '100%', height: 300 }}>
              {isLoading ? (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : error ? (
                <ErrorState
                  title="Failed to load transaction data"
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
                    <ShowChartIcon
                      sx={{
                        fontSize: 64,
                        color: 'text.disabled',
                        opacity: 0.5,
                      }}
                    />
                  }
                  title="No transaction data available"
                />
              )}
            </Box>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
