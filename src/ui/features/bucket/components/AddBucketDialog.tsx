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
import { useEffect, useRef } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateBucketMutation } from '../api/bucketApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';
import { useGetAccountsQuery } from '../../account/api/accountApi';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import {
  addAssetBucketSchema,
  type AddBucketFormData,
} from '../schemas/bucket.schemas';

interface AddBucketDialogProps {
  account?: Account;
  open: boolean;
  onClose: () => void;
}

export function AddBucketDialog({
  account,
  open,
  onClose,
}: AddBucketDialogProps) {
  const { data: accounts = [] } = useGetAccountsQuery();
  const assetAccounts = accounts.filter((acc) => acc.type === 'asset');

  const [createBucket, { isLoading }] = useCreateBucketMutation();
  const { setError } = useDashboardError();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AddBucketFormData>({
    resolver: zodResolver(addAssetBucketSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      type: 'saving',
      account_id: account?.id,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        type: 'saving',
        account_id: account?.id,
      });
      // Focus the name field after a short delay to ensure the dialog is fully rendered
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [open, account?.id, form]);

  const onSubmit = async (data: AddBucketFormData) => {
    try {
      await createBucket({
        name: data.name,
        type: data.type,
        notes: '',
        account_id: data.account_id,
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

  const accountOptions = assetAccounts.map((acc) => ({
    value: acc.id,
    label: acc.name,
  }));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle variant="h3">Add Asset Bucket</DialogTitle>
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
                    <FormControlLabel
                      value="saving"
                      control={<Radio />}
                      label="Saving"
                      disabled={isLoading}
                    />
                    <FormControlLabel
                      value="investment"
                      control={<Radio />}
                      label="Investment"
                      disabled={isLoading}
                    />
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
