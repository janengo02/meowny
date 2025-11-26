import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
  // Initialize toBucketId with the bucketId if provided
  const [fromBucketId, setFromBucketId] = useState<string | null>(null);
  const [toBucketId, setToBucketId] = useState<string | null>(() =>
    bucketId ? String(bucketId) : null,
  );
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [notes, setNotes] = useState('');
  const [createTransaction, { isLoading }] = useCreateTransactionMutation();
  const { data: buckets = [] } = useGetBucketsQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return;
    }

    // At least one bucket must be specified
    if (!fromBucketId && !toBucketId) {
      return;
    }

    try {
      await createTransaction({
        from_bucket_id: fromBucketId ? parseInt(fromBucketId) : null,
        to_bucket_id: toBucketId ? parseInt(toBucketId) : null,
        amount: amountValue,
        transaction_date: new Date(transactionDate).toISOString(),
        notes: notes || null,
      }).unwrap();

      // Reset form
      setFromBucketId(null);
      setToBucketId(bucketId ? String(bucketId) : null);
      setAmount('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleClose = () => {
    setFromBucketId(null);
    setToBucketId(bucketId ? String(bucketId) : null);
    setAmount('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    onClose();
  };

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
      <form onSubmit={handleSubmit}>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {/* From Bucket and To Bucket - Same Row */}
            <Grid container spacing={2}>
              <Grid size={6}>
                <FormControl fullWidth>
                  <InputLabel>From Bucket</InputLabel>
                  <Select
                    value={fromBucketId || ''}
                    onChange={(e) => setFromBucketId(e.target.value || null)}
                    label="From Bucket"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {buckets.map((bucket) => (
                      <MenuItem key={bucket.id} value={String(bucket.id)}>
                        {bucket.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth>
                  <InputLabel>To Bucket</InputLabel>
                  <Select
                    value={toBucketId || ''}
                    onChange={(e) => setToBucketId(e.target.value || null)}
                    label="To Bucket"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {buckets.map((bucket) => (
                      <MenuItem key={bucket.id} value={String(bucket.id)}>
                        {bucket.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Amount */}
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />

            {/* Transaction Date */}
            <TextField
              label="Transaction Date"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            {/* Notes */}
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !amount || (!fromBucketId && !toBucketId)}
          >
            Add Transaction
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
