import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useEffect, useRef, useMemo } from 'react';
import { useForm, FormProvider, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateBucketMutation } from '../api/bucketApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';
import { useGetAccountsQuery } from '../../account/api/accountApi';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import {
  createBucketSchema,
  type CreateBucketFormData,
} from '../schemas/bucket.schemas';

interface CreateBucketDialogProps {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  onSuccess?: (bucketId: number) => void;
  accountTypeFilter?: 'asset' | 'expense' | 'all';
  account?: Account;
}

export function CreateBucketDialog({
  open,
  onClose,
  initialName = '',
  onSuccess,
  accountTypeFilter = 'all',
  account,
}: CreateBucketDialogProps) {
  const { data: accounts = [] } = useGetAccountsQuery();
  const [createBucket, { isLoading }] = useCreateBucketMutation();
  const { setError } = useDashboardError();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Determine default bucket type based on filter
  const defaultBucketType =
    accountTypeFilter === 'expense' ? 'expense' : 'saving';

  const form = useForm<CreateBucketFormData>({
    resolver: zodResolver(createBucketSchema),
    mode: 'onChange',
    defaultValues: {
      name: initialName,
      type: defaultBucketType,
      account_id: account?.id,
    },
  });

  const selectedType = useWatch({
    control: form.control,
    name: 'type',
  });

  const accountOptions = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return [];
    }

    let filteredAccounts: Account[];

    // Filter accounts based on the selected bucket type
    if (selectedType === 'expense') {
      filteredAccounts = accounts.filter((acc) => acc.type === 'expense');
    } else {
      filteredAccounts = accounts.filter((acc) => acc.type === 'asset');
    }

    return filteredAccounts.map((acc) => ({
      value: acc.id,
      label: acc.name,
    }));
  }, [accounts, selectedType]);

  // Available bucket types based on accountTypeFilter
  const availableBucketTypes = useMemo(() => {
    if (accountTypeFilter === 'asset') {
      return ['saving', 'investment'];
    } else if (accountTypeFilter === 'expense') {
      return ['expense'];
    }
    return ['saving', 'investment', 'expense'];
  }, [accountTypeFilter]);

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialName,
        type: defaultBucketType,
        account_id: account?.id,
      });
      // Focus the name field after a short delay to ensure the dialog is fully rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open, initialName, defaultBucketType, account?.id, form]);

  // Reset account_id when switching between expense and asset account types
  useEffect(() => {
    if (open) {
      const currentAccountId = form.getValues('account_id');
      if (currentAccountId) {
        const currentAccount = accounts?.find(
          (acc) => acc.id === currentAccountId,
        );
        if (currentAccount) {
          const needsExpenseAccount = selectedType === 'expense';
          const hasExpenseAccount = currentAccount.type === 'expense';
          // Reset if account type doesn't match the selected bucket type
          if (needsExpenseAccount !== hasExpenseAccount) {
            form.resetField('account_id');
          }
        }
      }
    }
  }, [selectedType, form, open, accounts]);

  const onSubmit = async (data: CreateBucketFormData) => {
    try {
      const result = await createBucket({
        name: data.name,
        type: data.type,
        notes: '',
        account_id: data.account_id,
      }).unwrap();
      if (onSuccess && result.id) {
        onSuccess(result.id);
      }
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle variant="h3">Create Bucket</DialogTitle>
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
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <FormControl component="fieldset">
                  <FormLabel component="legend">Bucket Type</FormLabel>
                  <RadioGroup {...field} row>
                    {availableBucketTypes.includes('saving') && (
                      <FormControlLabel
                        value="saving"
                        control={<Radio />}
                        label="Saving"
                        disabled={isLoading}
                      />
                    )}
                    {availableBucketTypes.includes('investment') && (
                      <FormControlLabel
                        value="investment"
                        control={<Radio />}
                        label="Investment"
                        disabled={isLoading}
                      />
                    )}
                    {availableBucketTypes.includes('expense') && (
                      <FormControlLabel
                        value="expense"
                        control={<Radio />}
                        label="Expense"
                        disabled={isLoading}
                      />
                    )}
                  </RadioGroup>
                </FormControl>
              )}
            />
            <FormSelectField
              name="account_id"
              label="Account"
              options={accountOptions}
            />
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
