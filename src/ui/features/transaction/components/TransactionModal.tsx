import { useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import {
  Box,
  Button,
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
import { FormNumberInput } from '../../../shared/components/form/FormNumberInput';
import { DateTimePickerField } from '../../../shared/components/form/DateTimePickerField';
import {
  transactionModalSchema,
  type TransactionModalFormData,
} from '../schemas/transaction.schema';
import {
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
} from '../api/transactionApi';
import { FormMoneyInput } from '../../../shared/components/form/FormMoneyInput';
import { formatDateForDB } from '../../../shared/utils/dateTime';
import { useGetBucketsQuery } from '../../bucket/api/bucketApi';

interface TransactionModalProps {
  bucketId?: number;
  open: boolean;
  onClose: () => void;
  transactionToEdit?: TransactionWithBucketNames | null;
}

export function TransactionModal({
  bucketId,
  open,
  onClose,
  transactionToEdit,
}: TransactionModalProps) {
  const [createTransaction, { isLoading: isCreating }] =
    useCreateTransactionMutation();
  const [updateTransaction, { isLoading: isUpdating }] =
    useUpdateTransactionMutation();
  const { data: buckets = [] } = useGetBucketsQuery();

  const isLoading = isCreating || isUpdating;

  const form = useForm<TransactionModalFormData>({
    resolver: zodResolver(transactionModalSchema),
    mode: 'onChange',
    defaultValues: {
      from_bucket_id: '',
      to_bucket_id: bucketId ? String(bucketId) : '',
      amount: 0,
      transaction_date: dayjs(),
      notes: '',
    },
  });

  // Reset form when modal opens with a new bucketId or transaction to edit
  useEffect(() => {
    if (open) {
      if (transactionToEdit) {
        // Editing mode - populate form with transaction data
        form.reset({
          from_bucket_id: transactionToEdit.from_bucket_id
            ? String(transactionToEdit.from_bucket_id)
            : '',
          to_bucket_id: transactionToEdit.to_bucket_id
            ? String(transactionToEdit.to_bucket_id)
            : '',
          amount: transactionToEdit.amount,
          transaction_date: dayjs(transactionToEdit.transaction_date),
          notes: transactionToEdit.notes || '',
          from_units: transactionToEdit.from_units || undefined,
          to_units: transactionToEdit.to_units || undefined,
        });
      } else {
        // Create mode - reset to defaults
        form.reset({
          from_bucket_id: '',
          to_bucket_id: bucketId ? String(bucketId) : '',
          amount: 0,
          transaction_date: dayjs(),
          notes: '',
        });
      }
    }
  }, [open, bucketId, transactionToEdit, form]);

  const onSubmit = async (data: TransactionModalFormData) => {
    try {
      const transactionData = {
        from_bucket_id: data.from_bucket_id
          ? parseInt(data.from_bucket_id)
          : null,
        to_bucket_id: data.to_bucket_id ? parseInt(data.to_bucket_id) : null,
        amount: data.amount || 0,
        transaction_date: formatDateForDB(data.transaction_date),
        notes: data.notes || null,
        from_units: data.from_units || null,
        to_units: data.to_units || null,
      };

      if (transactionToEdit) {
        // Edit mode: use update mutation (backend handles delete-recreate)
        await updateTransaction({
          id: transactionToEdit.id,
          params: transactionData,
        }).unwrap();
      } else {
        // Create mode: use create mutation
        await createTransaction(transactionData).unwrap();
      }

      form.reset();
      onClose();
    } catch (error) {
      console.error(
        `Failed to ${transactionToEdit ? 'update' : 'create'} transaction:`,
        error,
      );
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Watch selected buckets to determine if unit fields should be shown
  const fromBucketId = useWatch({
    control: form.control,
    name: 'from_bucket_id',
  });
  const toBucketId = useWatch({ control: form.control, name: 'to_bucket_id' });

  // Find selected buckets and check if they are investment type
  const fromBucket = fromBucketId
    ? buckets.find((b) => b.id === parseInt(fromBucketId))
    : undefined;
  const toBucket = toBucketId
    ? buckets.find((b) => b.id === parseInt(toBucketId))
    : undefined;

  const showFromUnits = fromBucket?.type === 'investment';
  const showToUnits = toBucket?.type === 'investment';

  // Generate dynamic labels with bucket names
  const fromUnitsLabel = fromBucket
    ? `Sell Units for ${fromBucket.name}`
    : 'Sell Units';
  const toUnitsLabel = toBucket
    ? `Buy Units for ${toBucket.name}`
    : 'Buy Units';

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
            variant="h3"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pb: 1,
            }}
          >
            {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
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
                  <FormBucketSelectField
                    name="from_bucket_id"
                    label="From Bucket"
                    size="small"
                  />
                </Grid>
                <Grid size={6}>
                  <FormBucketSelectField
                    name="to_bucket_id"
                    label="To Bucket"
                    size="small"
                  />
                </Grid>
              </Grid>

              {/* Units - Optional fields for investment buckets */}
              {(showFromUnits || showToUnits) && (
                <Grid container spacing={2}>
                  {showFromUnits && (
                    <Grid size={showToUnits ? 6 : 12}>
                      <FormNumberInput
                        name="from_units"
                        label={fromUnitsLabel}
                        decimalScale={4}
                        allowNegative={false}
                      />
                    </Grid>
                  )}
                  {showToUnits && (
                    <Grid size={showFromUnits ? 6 : 12}>
                      <FormNumberInput
                        name="to_units"
                        label={toUnitsLabel}
                        decimalScale={4}
                        allowNegative={false}
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
                allowNegative={false}
              />

              {/* Transaction Date */}
              <DateTimePickerField
                name="transaction_date"
                label="Transaction Date & Time"
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
              {isLoading
                ? transactionToEdit
                  ? 'Updating...'
                  : 'Adding...'
                : transactionToEdit
                  ? 'Update Transaction'
                  : 'Add Transaction'}
            </Button>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  );
}
