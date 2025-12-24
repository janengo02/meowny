import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { useState } from 'react';
import { useCreateBucketMutation } from '../api/bucketApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';

interface AddExpenseBucketDialogProps {
  account: Account;
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
  const [name, setName] = useState('');
  const [createBucket, { isLoading }] = useCreateBucketMutation();
  const { setError } = useDashboardError();

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      await createBucket({
        name: name.trim(),
        type: 'expense',
        notes: '',
        account_id: account.id,
        bucket_category_id: categoryId ?? null,
      }).unwrap();
      setName('');
      onClose();
    } catch (error) {
      setError('Failed to create bucket. Please try again.');
      console.error('Failed to create bucket:', error);
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Expense Bucket</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Bucket Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSubmit();
              }
            }}
            disabled={isLoading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!name.trim() || isLoading}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
