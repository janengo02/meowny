import { Typography, Stack, Tabs, Tab } from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BucketValueHistoryTable } from './BucketValueHistoryTable';
import { BucketValueHistoryChart } from './BucketValueHistoryChart';
import { BucketTransactionHistoryChart } from './BucketTransactionHistoryChart';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import {
  bucketChartFilterSchema,
  type BucketChartFilterFormData,
} from '../schemas/bucket.schemas';

interface BucketPerformanceProps {
  bucket?: Bucket;
}

export function BucketPerformance({ bucket }: BucketPerformanceProps) {
  // Tab state management - 0 for Value History, 1 for Transaction History
  const [selectedTab, setSelectedTab] = useState(0);

  // Period filter form
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

  if (!bucket) return null;

  return (
    <FormProvider {...methods}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Performance
      </Typography>

      {/* Period Filter Controls */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
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

      {/* Tabs for switching between charts */}
      <Tabs
        value={bucket.type === 'expense' ? 0 : selectedTab}
        onChange={(_, newValue) => setSelectedTab(newValue)}
        sx={{ mb: 2 }}
      >
        {bucket.type !== 'expense' && <Tab label="Value History" />}
        <Tab label="Transaction History" />
      </Tabs>

      {/* Chart rendering based on bucket type and selected tab */}
      {bucket.type === 'expense' || selectedTab === 1 ? (
        <BucketTransactionHistoryChart
          bucketId={bucket.id}
          mode={mode}
          periodFrom={periodFrom}
          periodTo={periodTo}
        />
      ) : (
        <BucketValueHistoryChart
          bucketId={bucket.id}
          mode={mode}
          periodFrom={periodFrom}
          periodTo={periodTo}
        />
      )}

      <Typography variant="h4" sx={{ mb: 2 }}>
        Logs
      </Typography>

      {/* Value History Logs Section */}
      <BucketValueHistoryTable
        bucketId={bucket.id}
        bucketType={bucket.type}
        periodFrom={periodFrom}
        periodTo={periodTo}
      />
    </FormProvider>
  );
}
