import { useEffect, useState, useMemo } from 'react';
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
  TextField,
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

  // Create a map of bucket name (lowercase) to bucket ID for quick lookup
  const bucketNameToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    buckets.forEach((bucket) => {
      map.set(bucket.name.toLowerCase().trim(), bucket.id);
    });
    return map;
  }, [buckets]);

  // Auto-map bucket names from CSV to bucket IDs on initial load
  const initialMappedTransactions = useMemo(() => {
    return transactions.map((transaction) => {
      const bucketName = transaction.bucket.toLowerCase().trim();
      const bucketId = bucketNameToIdMap.get(bucketName);
      const bucketIdStr = bucketId ? bucketId.toString() : '';

      // Parse amount to determine direction
      const cleanAmount = transaction.transactionAmount.replace(/[^\d.-]/g, '');
      const amount = parseFloat(cleanAmount) || 0;

      return {
        ...transaction,
        bucket: bucketIdStr,
        // If positive amount, set toBucket; if negative, set fromBucket
        fromBucket: amount < 0 ? bucketIdStr : '',
        toBucket: amount >= 0 ? bucketIdStr : '',
      };
    });
  }, [transactions, bucketNameToIdMap]);

  // Set edited transactions to the initial transactions
  const [editedTransactions, setEditedTransactions] =
    useState<MappedTransaction[]>(initialMappedTransactions);

  const handleFromBucketChange = (index: number, bucketId: string) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], fromBucket: bucketId };
    setEditedTransactions(updated);
  };

  const handleToBucketChange = (index: number, bucketId: string) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], toBucket: bucketId };
    setEditedTransactions(updated);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], notes };
    setEditedTransactions(updated);
  };

  const handleImport = async () => {
    setIsImporting(true);
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
      // Filter transactions that have at least one bucket selected
      const transactionsToImport = editedTransactions.filter(
        (t) =>
          (t.fromBucket && t.fromBucket.trim() !== '') ||
          (t.toBucket && t.toBucket.trim() !== ''),
      );

      skipCount = editedTransactions.length - transactionsToImport.length;

      // Import each transaction
      for (const transaction of transactionsToImport) {
        try {
          // Parse amount and remove any non-numeric characters (like commas, currency symbols)
          const cleanAmount = transaction.transactionAmount.replace(/[^\d.-]/g, '');
          const amount = Math.abs(parseFloat(cleanAmount) || 0);

          const fromBucketId = transaction.fromBucket ? parseInt(transaction.fromBucket) : null;
          const toBucketId = transaction.toBucket ? parseInt(transaction.toBucket) : null;

          await createTransaction({
            from_bucket_id: fromBucketId,
            to_bucket_id: toBucketId,
            amount: amount,
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
    setEditedTransactions(initialMappedTransactions);
  }, [initialMappedTransactions]);

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
              '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
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
                  From Bucket
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>
                  To Bucket
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
                  <TableCell
                    align="right"
                    sx={{
                      color: (() => {
                        const amount = parseFloat(
                          transaction.transactionAmount.replace(/[^\d.-]/g, ''),
                        ) || 0;
                        if (amount > 0) return 'success.main';
                        if (amount < 0) return 'error.main';
                        return 'inherit';
                      })(),
                      fontWeight: 500,
                    }}
                  >
                    {formatMoney(
                      parseFloat(transaction.transactionAmount.replace(/[^\d.-]/g, '')) || 0,
                    )}
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={transaction.notes}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      variant="standard"
                      size="small"
                      fullWidth
                      disabled={isImporting}
                      placeholder="Add notes..."
                      slotProps={{
                        input: {
                          disableUnderline: true,
                        },
                      }}
                      sx={{
                        maxWidth: 300,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={transaction.fromBucket}
                        onChange={(e) =>
                          handleFromBucketChange(index, e.target.value)
                        }
                        displayEmpty
                        disabled={isImporting}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {buckets.map((bucket) => (
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
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={transaction.toBucket}
                        onChange={(e) =>
                          handleToBucketChange(index, e.target.value)
                        }
                        displayEmpty
                        disabled={isImporting}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {buckets.map((bucket) => (
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
