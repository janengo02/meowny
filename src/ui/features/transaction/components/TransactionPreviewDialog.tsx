import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { type MappedTransaction } from './CsvImportFlow';
import { useAppSelector } from '../../../store/hooks';
import { formatMoney } from '../../../shared/utils';
import { useCreateTransactionMutation } from '../api/transactionApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';

interface TransactionPreviewDialogProps {
  open: boolean;
  transactions: MappedTransaction[];
  onClose: () => void;
}

export function TransactionPreviewDialog({
  open,
  transactions,
  onClose,
}: TransactionPreviewDialogProps) {
  const buckets = useAppSelector((state) => state.bucket.buckets);
  const [createTransaction] = useCreateTransactionMutation();
  const { setError } = useDashboardError();
  const [isImporting, setIsImporting] = useState(false);

  // Filter for expense buckets only
  const expenseBuckets = buckets.filter((bucket) => bucket.type === 'expense');

  // Set edited transactions to the initial transactions
  const [editedTransactions, setEditedTransactions] =
    useState<MappedTransaction[]>(transactions);

  const handleBucketChange = (index: number, bucketId: string) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], bucket: bucketId };
    setEditedTransactions(updated);
  };

  const handleImport = async () => {
    setIsImporting(true);
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
      // Filter transactions that have a bucket selected
      const transactionsToImport = editedTransactions.filter(
        (t) => t.bucket && t.bucket.trim() !== '',
      );

      skipCount = editedTransactions.length - transactionsToImport.length;

      // Import each transaction
      for (const transaction of transactionsToImport) {
        try {
          await createTransaction({
            from_bucket_id: null,
            to_bucket_id: parseInt(transaction.bucket),
            amount: parseFloat(transaction.transactionAmount) || 0,
            transaction_date: transaction.transactionDate,
            notes: transaction.notes || null,
          }).unwrap();
          successCount++;
        } catch (error) {
          console.error('Error importing transaction:', error);
          errorCount++;
        }
      }

      // Show success message or error
      if (errorCount > 0) {
        setError(
          `Import completed with errors: ${successCount} imported, ${skipCount} skipped, ${errorCount} failed`,
        );
      }

      onClose();
    } catch {
      setError('Failed to import transactions. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    setEditedTransactions(transactions);
  }, [transactions]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h2">Transaction Preview</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Review and assign buckets to {editedTransactions.length}{' '}
            transaction(s)
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <TableContainer
          component={Paper}
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            fontFamily:
              'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", Meiryo, sans-serif',
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Transaction Date
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">
                  Transaction Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>
                  Bucket
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editedTransactions.map((transaction, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <TableCell>{transaction.transactionDate}</TableCell>
                  <TableCell align="right">
                    {formatMoney(
                      parseFloat(transaction.transactionAmount) || 0,
                    )}
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {transaction.notes}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={transaction.bucket}
                        onChange={(e) =>
                          handleBucketChange(index, e.target.value)
                        }
                        displayEmpty
                        disabled={isImporting}
                      >
                        <MenuItem value="">
                          <em>Select bucket</em>
                        </MenuItem>
                        {expenseBuckets.map((bucket) => (
                          <MenuItem
                            key={bucket.id}
                            value={bucket.id.toString()}
                          >
                            {bucket.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {editedTransactions.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              color: 'text.secondary',
            }}
          >
            <Typography>No transactions to preview</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={isImporting}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={editedTransactions.length === 0 || isImporting}
          startIcon={isImporting ? <CircularProgress size={16} /> : null}
        >
          {isImporting ? 'Importing...' : 'Import Transactions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
