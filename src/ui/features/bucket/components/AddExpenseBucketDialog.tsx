import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import { useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateBucketMutation } from '../api/bucketApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';
import { useGetAccountsQuery } from '../../account/api/accountApi';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import {
  addExpenseBucketSchema,
  type AddExpenseBucketFormData,
} from '../schemas/bucket.schemas';

interface AddExpenseBucketDialogProps {
  account?: Account;
  categoryId?: number | null;
  open: boolean;
  onClose: () => void;
}

export function AddExpenseBucketDialog({
  account,
  categoryId,
  open,
  onClose,
}: AddExpenseBucketDialogProps) {
  const { data: accounts = [] } = useGetAccountsQuery();
  const expenseAccounts = accounts.filter((acc) => acc.type === 'expense');
  const [createBucket, { isLoading }] = useCreateBucketMutation();
  const { setError } = useDashboardError();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AddExpenseBucketFormData>({
    resolver: zodResolver(addExpenseBucketSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      account_id: account?.id,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        account_id: account?.id,
      });
      // Focus the name field after a short delay to ensure the dialog is fully rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open, account?.id, form]);

  const onSubmit = async (data: AddExpenseBucketFormData) => {
    try {
      await createBucket({
        name: data.name,
        type: 'expense',
        notes: '',
        account_id: data.account_id,
        bucket_category_id: categoryId ?? null,
      }).unwrap();
      onClose();
    } catch (error) {
      setError('Failed to create bucket. Please try again.');
      console.error('Failed to create bucket:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const accountOptions = expenseAccounts.map((acc) => ({
    value: acc.id,
    label: acc.name,
  }));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle variant="h3">Add Expense Bucket</DialogTitle>
      <DialogContent>
        <FormProvider {...form}>
          <Box
            component="form"
            onSubmit={form.handleSubmit(onSubmit)}
            sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormTextField
              name="name"
              label="Bucket Name"
              inputRef={nameInputRef}
            />
            {!account && (
              <FormSelectField
                name="account_id"
                label="Account"
                options={accountOptions}
              />
            )}
          </Box>
        </FormProvider>
      </DialogContent>
      <DialogActions sx={{ mb: 2, mr: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          variant="contained"
          disabled={isLoading}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
