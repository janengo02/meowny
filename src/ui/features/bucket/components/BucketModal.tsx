import {
  Box,
  CircularProgress,
  Drawer,
  Divider,
  IconButton,
  Typography,
  Stack,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import dayjs from 'dayjs';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetBucketQuery, useUpdateBucketMutation } from '../api/bucketApi';
import { BucketCategorySelect } from './BucketCategorySelect';
import { useAppSelector } from '../../../store/hooks';
import { BucketValueHistoryTable } from './BucketValueHistoryTable';
import { BucketGoal } from './BucketGoal';
import { BucketValueHistoryChart } from './BucketValueHistoryChart';
import { BucketTransactionHistoryChart } from './BucketTransactionHistoryChart';
import { DatePickerField } from '../../../shared/components/form/DatePickerField';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import {
  bucketChartFilterSchema,
  type BucketChartFilterFormData,
} from '../schemas/bucket.schemas';
import { BucketSummary } from './BucketSummary';
import { BucketTitle } from './BucketTitle';
import { BucketModalFooter } from './BucketModalFooter';
import { selectAccountById } from '../../account/selectors/accountSelectors';

interface BucketModalProps {
  bucketId: number | null;
  open: boolean;
  onClose: () => void;
}

export function BucketModal({ bucketId, open, onClose }: BucketModalProps) {
  const { data: bucket, isLoading } = useGetBucketQuery(bucketId!, {
    skip: !bucketId,
  });

  const [updateBucket] = useUpdateBucketMutation();

  // Get the account for this bucket
  const account = useAppSelector((state) =>
    bucket?.account_id ? selectAccountById(state, bucket.account_id) : null,
  );

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

  const handleToggleHidden = async () => {
    if (!bucket) return;
    try {
      await updateBucket({
        id: bucket.id,
        params: { is_hidden: !bucket.is_hidden },
      }).unwrap();
    } catch (error) {
      console.error('Failed to toggle bucket visibility:', error);
    }
  };

  if (!bucketId) return null;

  // Show loading when initially loading or when bucket data doesn't match the requested bucketId
  // Don't show loading when just refetching the same bucket (updates)
  const isLoadingCorrectBucket = isLoading || !bucket || bucket.id !== bucketId;

  if (isLoadingCorrectBucket) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        variant="temporary"
        ModalProps={{
          disableScrollLock: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', md: '60%' },
            bgcolor: 'background.default',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{
        keepMounted: true,
        disableScrollLock: true,
      }}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', md: '60%' },
          bgcolor: 'background.default',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <BucketTitle bucket={bucket} />
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {bucket.type !== 'expense' && account && (
            <Chip
              label={account.name}
              size="medium"
              sx={{
                borderColor: account.color,
                color: account.color,
              }}
              variant="outlined"
            />
          )}
          <Chip
            label={bucket.type}
            size="medium"
            variant="outlined"
            color={
              bucket.type === 'saving'
                ? 'info'
                : bucket.type === 'investment'
                  ? 'warning'
                  : 'default'
            }
            sx={{
              textTransform: 'capitalize',
            }}
          />

          <BucketCategorySelect
            bucketId={bucket.id}
            value={bucket.bucket_category_id}
          />
          <Box sx={{ ml: 'auto' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!bucket.is_hidden}
                  onChange={handleToggleHidden}
                  size="small"
                />
              }
              label="Show on Dashboard"
              labelPlacement="start"
            />
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        {/* Summary Stats */}
        <BucketSummary bucket={bucket} />
        {/* Bucket Goal Section */}
        <Divider sx={{ my: 2 }} />
        <BucketGoal bucketId={bucketId} />
        {/* Graph Section */}
        <Divider sx={{ my: 2 }} />
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

          {bucket.type === 'expense' ? (
            <BucketTransactionHistoryChart
              bucketId={bucketId}
              mode={mode}
              periodFrom={periodFrom}
              periodTo={periodTo}
            />
          ) : (
            <BucketValueHistoryChart
              bucketId={bucketId}
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
            bucketId={bucketId}
            bucketType={bucket.type}
            periodFrom={periodFrom}
            periodTo={periodTo}
          />
        </FormProvider>
        <BucketModalFooter bucket={bucket} onClose={onClose} />
      </Box>
    </Drawer>
  );
}
