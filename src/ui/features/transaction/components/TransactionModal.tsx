import { useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { FormBucketSelectField } from '../../../shared/components/form/FormBucketSelectField';
import {
  baseTransactionSchema,
  type BaseTransactionFormData,
} from '../schemas/transaction.schema';
import { useCreateTransactionMutation } from '../api/transactionApi';
import { getTokyoDateTime } from '../../../shared/utils';
import { FormMoneyInput } from '../../../shared/components/form/FormMoneyInput';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import { useGetBucketsQuery } from '../../bucket/api/bucketApi';

interface TransactionModalProps {
  bucketId?: number;
  open: boolean;
  onClose: () => void;
}

export function TransactionModal({
  bucketId,
  open,
  onClose,
}: TransactionModalProps) {
  const [createTransaction, { isLoading }] = useCreateTransactionMutation();
  const { data: buckets = [] } = useGetBucketsQuery();

  const form = useForm<BaseTransactionFormData>({
    resolver: zodResolver(baseTransactionSchema),
    mode: 'onChange',
    defaultValues: {
      from_bucket_id: '',
      to_bucket_id: bucketId ? String(bucketId) : '',
      amount: 0,
      transaction_date: getTokyoDateTime(),
      notes: '',
    },
  });

  // Reset form when modal opens with a new bucketId
  useEffect(() => {
    if (open) {
      form.reset({
        from_bucket_id: '',
        to_bucket_id: bucketId ? String(bucketId) : '',
        amount: 0,
        transaction_date: getTokyoDateTime(),
        notes: '',
      });
    }
  }, [open, bucketId, form]);

  const onSubmit = async (data: BaseTransactionFormData) => {
    try {
      await createTransaction({
        from_bucket_id: data.from_bucket_id
          ? parseInt(data.from_bucket_id)
          : null,
        to_bucket_id: data.to_bucket_id ? parseInt(data.to_bucket_id) : null,
        amount: data.amount || 0,
        transaction_date: formatDateForDB(data.transaction_date),
        notes: data.notes || null,
        from_units: data.from_units || null,
        to_units: data.to_units || null,
      }).unwrap();

      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Watch selected buckets to determine if unit fields should be shown
  const fromBucketId = useWatch({ control: form.control, name: 'from_bucket_id' });
  const toBucketId = useWatch({ control: form.control, name: 'to_bucket_id' });

  // Find selected buckets and check if they are investment type
  const fromBucket = fromBucketId ? buckets.find(b => b.id === parseInt(fromBucketId)) : undefined;
  const toBucket = toBucketId ? buckets.find(b => b.id === parseInt(toBucketId)) : undefined;

  const showFromUnits = fromBucket?.type === 'investment';
  const showToUnits = toBucket?.type === 'investment';

  // Generate dynamic labels with bucket names
  const fromUnitsLabel = fromBucket ? `Sell Units for ${fromBucket.name}` : 'Sell Units';
  const toUnitsLabel = toBucket ? `Buy Units for ${toBucket.name}` : 'Buy Units';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <FormProvider {...form}>
        <Box component="form" onSubmit={form.handleSubmit(onSubmit)}>
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 1,
            }}
          >
            Add Transaction
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}
            >
              {/* From Bucket and To Bucket - Same Row */}
              <Grid container spacing={2}>
                <Grid size={6}>
                    <Box sx={{ mt: 'auto' }}>
                      <FormBucketSelectField
                        name="from_bucket_id"
                        label="From Bucket"
                      />
                      {fromBucket && (
                        <Chip
                          label={fromBucket.type.charAt(0).toUpperCase() + fromBucket.type.slice(1)}
                          size="small"
                          variant="outlined"
                          color={
                            fromBucket.type === 'saving' ? 'info' :
                            fromBucket.type === 'investment' ? 'warning' :
                            'default'
                          }
                        />
                    )}
                    </Box>
                </Grid>
                <Grid size={6}>
                  <Box sx={{ mt: 'auto' }}>
                    <FormBucketSelectField
                      name="to_bucket_id"
                      label="To Bucket"
                    />
                    {toBucket && (
                      <Chip
                        label={toBucket.type.charAt(0).toUpperCase() + toBucket.type.slice(1)}
                        size="small"
                        variant="outlined"
                        color={
                          toBucket.type === 'saving' ? 'info' :
                          toBucket.type === 'investment' ? 'warning' :
                          'default'
                        }
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Units - Optional fields for investment buckets */}
              {(showFromUnits || showToUnits) && (
                <Grid container spacing={2}>
                  {showFromUnits && (
                    <Grid size={showToUnits ? 6 : 12}>
                      <FormTextField
                        name="from_units"
                        label={fromUnitsLabel}
                        type="number"
                        slotProps={{
                          htmlInput: {
                            step: '0.0001',
                            min: '0',
                          },
                        }}
                      />
                    </Grid>
                  )}
                  {showToUnits && (
                    <Grid size={showFromUnits ? 6 : 12}>
                      <FormTextField
                        name="to_units"
                        label={toUnitsLabel}
                        type="number"
                        slotProps={{
                          htmlInput: {
                            step: '0.0001',
                            min: '0',
                          },
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
              )}
              {/* Amount */}
              <FormMoneyInput
                name="amount"
                label="Amount"
                variant="outlined"
                size="medium"
                allowNegative={false}
              />

              {/* Transaction Date */}
              <FormTextField
                name="transaction_date"
                label="Transaction Date & Time (Tokyo)"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                slotProps={{ htmlInput: { step: 1 } }}
              />

              {/* Notes */}
              <FormTextField name="notes" label="Notes" multiline rows={3} />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  );
}
