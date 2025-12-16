import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useState } from 'react';
import { useCreateBucketMutation } from '../api/bucketApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';

interface AddBucketDialogProps {
  account: Account;
  open: boolean;
  onClose: () => void;
}

export function AddBucketDialog({ account, open, onClose }: AddBucketDialogProps) {
  const [name, setName] = useState('');
  const [bucketType, setBucketType] = useState<BucketTypeEnum>(
    account.type === 'expense' ? 'expense' : 'saving'
  );
  const [createBucket, { isLoading }] = useCreateBucketMutation();
  const { setError } = useDashboardError();

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      await createBucket({
        name: name.trim(),
        type: bucketType,
        notes: '',
        account_id: account.id,
      }).unwrap();
      setName('');
      setBucketType(account.type === 'expense' ? 'expense' : 'saving');
      onClose();
    } catch (error) {
      setError('Failed to create bucket. Please try again.');
      console.error('Failed to create bucket:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setBucketType(account.type === 'expense' ? 'expense' : 'saving');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add Bucket to {account.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
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

          {account.type === 'asset' ? (
            <FormControl component="fieldset">
              <FormLabel component="legend">Bucket Type</FormLabel>
              <RadioGroup
                value={bucketType}
                onChange={(e) => setBucketType(e.target.value as BucketTypeEnum)}
              >
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
          ) : (
            <Box sx={{ color: 'text.secondary' }}>
              Bucket type: Expense (fixed for expense accounts)
            </Box>
          )}
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
