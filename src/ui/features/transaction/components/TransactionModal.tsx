import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import {
  transactionSchema,
  type TransactionFormData,
} from '../schemas/transaction.schema';
import { useCreateTransactionMutation } from '../api/transactionApi';
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

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: {
      from_bucket_id: '',
      to_bucket_id: bucketId ? String(bucketId) : '',
      amount: '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // Reset form when modal opens with a new bucketId
  useEffect(() => {
    if (open) {
      form.reset({
        from_bucket_id: '',
        to_bucket_id: bucketId ? String(bucketId) : '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [open, bucketId, form]);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      await createTransaction({
        from_bucket_id: data.from_bucket_id
          ? parseInt(data.from_bucket_id)
          : null,
        to_bucket_id: data.to_bucket_id ? parseInt(data.to_bucket_id) : null,
        amount: parseFloat(data.amount),
        transaction_date: new Date(data.transaction_date).toISOString(),
        notes: data.notes || null,
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

  const bucketOptions = [
    { value: '', label: 'Income' },
    ...buckets.map((bucket) => ({
      value: String(bucket.id),
      label: bucket.name,
    })),
  ];

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
                  <FormSelectField
                    name="from_bucket_id"
                    label="From Bucket"
                    options={bucketOptions}
                  />
                </Grid>
                <Grid size={6}>
                  <FormSelectField
                    name="to_bucket_id"
                    label="To Bucket"
                    options={bucketOptions}
                  />
                </Grid>
              </Grid>

              {/* Amount */}
              <FormTextField
                name="amount"
                label="Amount"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
              />

              {/* Transaction Date */}
              <FormTextField
                name="transaction_date"
                label="Transaction Date"
                type="date"
                InputLabelProps={{ shrink: true }}
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
