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
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { type MappedTransaction } from './CsvImportFlow';
import { useAppSelector } from '../../../store/hooks';
import { formatMoney } from '../../../shared/utils';
import { useCreateTransactionMutation } from '../api/transactionApi';
import { useDashboardError } from '../../dashboard/hooks/useDashboardError';

type ImportStatus = 'pending' | 'duplicate_detected' | 'importing' | 'success' | 'duplicate_skipped' | 'duplicate_imported' | 'error';

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
  const [duplicatesAllowed, setDuplicatesAllowed] = useState(false);
  const [importStatuses, setImportStatuses] = useState<Record<number, ImportStatus>>({});

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
    // Check for duplicates after change
    checkAndUpdateDuplicateStatus(index, updated[index]);
  };

  const handleToBucketChange = (index: number, bucketId: string) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], toBucket: bucketId };
    setEditedTransactions(updated);
    // Check for duplicates after change
    checkAndUpdateDuplicateStatus(index, updated[index]);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], notes };
    setEditedTransactions(updated);
    // Check for duplicates after change
    checkAndUpdateDuplicateStatus(index, updated[index]);
  };

  // Check if a transaction is a duplicate using the API
  const checkDuplicate = async (
    transactionDate: string,
    amount: number,
    fromBucketId: number | null,
    toBucketId: number | null,
    notes: string | null,
  ): Promise<boolean> => {
    try {
      const isDuplicate = await window.electron.checkDuplicateTransaction({
        transaction_date: transactionDate,
        amount: amount,
        from_bucket_id: fromBucketId,
        to_bucket_id: toBucketId,
        notes: notes,
      });
      return isDuplicate;
    } catch (error) {
      console.error('Error checking for duplicate:', error);
      return false;
    }
  };

  // Check and update duplicate status for a specific transaction
  const checkAndUpdateDuplicateStatus = async (
    index: number,
    transaction: MappedTransaction,
  ) => {
    // Only check if we have at least one bucket selected
    if (!transaction.fromBucket && !transaction.toBucket) {
      return;
    }

    const cleanAmount = transaction.transactionAmount.replace(/[^\d.-]/g, '');
    const amount = Math.abs(parseFloat(cleanAmount) || 0);
    const fromBucketId = transaction.fromBucket ? parseInt(transaction.fromBucket) : null;
    const toBucketId = transaction.toBucket ? parseInt(transaction.toBucket) : null;
    const notes = transaction.notes || null;

    const hasDuplicate = await checkDuplicate(
      transaction.transactionDate,
      amount,
      fromBucketId,
      toBucketId,
      notes,
    );

    setImportStatuses((prev) => ({
      ...prev,
      [index]: hasDuplicate ? 'duplicate_detected' : 'pending',
    }));
  };

  const handleImport = async () => {
    setIsImporting(true);
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    let duplicateSkippedCount = 0;
    let duplicateImportedCount = 0;

    // Reset import statuses
    const newStatuses: Record<number, ImportStatus> = {};
    editedTransactions.forEach((_, index) => {
      newStatuses[index] = 'pending';
    });
    setImportStatuses(newStatuses);

    try {
      // Filter transactions that have at least one bucket selected
      const transactionsToImport = editedTransactions.filter(
        (t) =>
          (t.fromBucket && t.fromBucket.trim() !== '') ||
          (t.toBucket && t.toBucket.trim() !== ''),
      );

      skipCount = editedTransactions.length - transactionsToImport.length;

      // Mark skipped transactions (no bucket selected)
      editedTransactions.forEach((t, index) => {
        if (!((t.fromBucket && t.fromBucket.trim() !== '') || (t.toBucket && t.toBucket.trim() !== ''))) {
          newStatuses[index] = 'error';
          setImportStatuses({ ...newStatuses });
        }
      });

      // Import each transaction
      for (let i = 0; i < transactionsToImport.length; i++) {
        const transaction = transactionsToImport[i];
        const originalIndex = editedTransactions.indexOf(transaction);

        try {
          // Update status to importing
          newStatuses[originalIndex] = 'importing';
          setImportStatuses({ ...newStatuses });

          // Parse amount and remove any non-numeric characters (like commas, currency symbols)
          const cleanAmount = transaction.transactionAmount.replace(/[^\d.-]/g, '');
          const amount = Math.abs(parseFloat(cleanAmount) || 0);

          const fromBucketId = transaction.fromBucket ? parseInt(transaction.fromBucket) : null;
          const toBucketId = transaction.toBucket ? parseInt(transaction.toBucket) : null;
          const notes = transaction.notes || null;

          // Check for duplicates
          const hasDuplicate = await checkDuplicate(
            transaction.transactionDate,
            amount,
            fromBucketId,
            toBucketId,
            notes,
          );

          if (hasDuplicate && !duplicatesAllowed) {
            // Skip duplicate
            newStatuses[originalIndex] = 'duplicate_skipped';
            setImportStatuses({ ...newStatuses });
            duplicateSkippedCount++;
            continue;
          }

          // Create transaction
          await createTransaction({
            from_bucket_id: fromBucketId,
            to_bucket_id: toBucketId,
            amount: amount,
            transaction_date: transaction.transactionDate,
            notes: notes,
          }).unwrap();

          if (hasDuplicate && duplicatesAllowed) {
            newStatuses[originalIndex] = 'duplicate_imported';
            setImportStatuses({ ...newStatuses });
            duplicateImportedCount++;
          } else {
            newStatuses[originalIndex] = 'success';
            setImportStatuses({ ...newStatuses });
          }
          successCount++;
        } catch (error) {
          console.error('Error importing transaction:', error);
          newStatuses[originalIndex] = 'error';
          setImportStatuses({ ...newStatuses });
          errorCount++;
        }
      }

      // Show success message or error
      if (errorCount > 0 || duplicateSkippedCount > 0) {
        const messageParts = [`${successCount} imported`];
        if (duplicateSkippedCount > 0) {
          messageParts.push(`${duplicateSkippedCount} duplicates skipped`);
        }
        if (duplicateImportedCount > 0) {
          messageParts.push(`${duplicateImportedCount} duplicates imported`);
        }
        if (skipCount > 0) {
          messageParts.push(`${skipCount} skipped (no bucket)`);
        }
        if (errorCount > 0) {
          messageParts.push(`${errorCount} failed`);
        }
        setError(`Import completed: ${messageParts.join(', ')}`);
      }

      // Don't close immediately, let user see the status
      if (!isImporting) {
        onClose();
      }
    } catch {
      setError('Failed to import transactions. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    setEditedTransactions(initialMappedTransactions);
    // Reset import statuses when transactions change
    const newStatuses: Record<number, ImportStatus> = {};
    initialMappedTransactions.forEach((_, index) => {
      newStatuses[index] = 'pending';
    });
    setImportStatuses(newStatuses);

    // Check for duplicates on initial load
    const checkAllDuplicates = async () => {
      for (let index = 0; index < initialMappedTransactions.length; index++) {
        await checkAndUpdateDuplicateStatus(index, initialMappedTransactions[index]);
      }
    };
    checkAllDuplicates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          alignItems: 'flex-start',
          pb: 1,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2">Transaction Preview</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Review and assign buckets to {editedTransactions.length}{' '}
            transaction(s)
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={duplicatesAllowed}
                onChange={(e) => setDuplicatesAllowed(e.target.checked)}
                disabled={isImporting}
                size="small"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                Allow duplicate transactions
              </Typography>
            }
            sx={{ mt: 1 }}
          />
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
                <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>
                  Status
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
                  <TableCell>
                    {importStatuses[index] === 'pending' && (
                      <Chip label="Pending" size="small" variant="outlined" />
                    )}
                    {importStatuses[index] === 'duplicate_detected' && (
                      <Chip
                        label="Duplicate Found"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                    {importStatuses[index] === 'importing' && (
                      <Chip
                        label="Importing..."
                        size="small"
                        color="info"
                        icon={<CircularProgress size={12} />}
                      />
                    )}
                    {importStatuses[index] === 'success' && (
                      <Chip label="Imported" size="small" color="success" />
                    )}
                    {importStatuses[index] === 'duplicate_skipped' && (
                      <Chip
                        label="Duplicate Skipped"
                        size="small"
                        color="warning"
                      />
                    )}
                    {importStatuses[index] === 'duplicate_imported' && (
                      <Chip
                        label="Duplicate Imported"
                        size="small"
                        color="info"
                      />
                    )}
                    {importStatuses[index] === 'error' && (
                      <Chip label="Error" size="small" color="error" />
                    )}
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
