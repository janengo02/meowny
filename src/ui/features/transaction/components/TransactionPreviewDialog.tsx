import { useState, useMemo, useCallback, useEffect } from 'react';
import { createSelector } from '@reduxjs/toolkit';
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
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAppSelector } from '../../../store/hooks';
import { type RootState } from '../../../store/store';
import { useCreateTransactionMutation } from '../api/transactionApi';
import { TransactionRow } from './TransactionRow';
import {
  type MappedTransaction,
  type TransactionImportFormData,
} from '../schemas/transaction.schema';
interface TransactionPreviewDialogProps {
  open: boolean;
  transactions: MappedTransaction[];
  onClose: () => void;
}

// Memoized selector to only extract bucket name and id
// This prevents unnecessary re-renders when bucket balances change
// We use a custom equality check to deeply compare the extracted fields
const selectBucketNameAndId = createSelector(
  [(state: RootState) => state.bucket.buckets],
  (buckets) => buckets.map(({ name, id }) => ({ name, id })),
  {
    memoizeOptions: {
      // Custom equality function that compares the actual bucket names/ids
      resultEqualityCheck: (
        prev: { name: string; id: number }[],
        next: { name: string; id: number }[],
      ) => {
        if (prev.length !== next.length) return false;
        return prev.every(
          (p, i) => p.id === next[i].id && p.name === next[i].name,
        );
      },
    },
  },
);

export function TransactionPreviewDialog({
  open,
  transactions,
  onClose,
}: TransactionPreviewDialogProps) {
  const buckets = useAppSelector(selectBucketNameAndId);
  const [createTransaction] = useCreateTransactionMutation();
  const [editedTransactions, setEditedTransactions] = useState<
    MappedTransaction[]
  >([]);

  // Import status - combines isImporting and isImportComplete
  const [batchImportStatus, setBatchImportStatus] = useState<
    'idle' | 'importing' | 'complete'
  >('idle');

  // Alert state - combines message and severity
  const [alert, setAlert] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info';
  } | null>(null);

  // Create a map of bucket name (lowercase) to bucket ID for quick lookup
  const bucketNameToIdMap = useMemo(() => {
    const map = new Map<string, number>();
    buckets.forEach((bucket) => {
      map.set(bucket.name.toLowerCase().trim(), bucket.id);
    });
    return map;
  }, [buckets]);

  // Auto-map bucket names from CSV to bucket IDs and sort by date
  const initialMappedTransactions = useMemo(() => {
    const mapped = transactions.map(
      (transaction): TransactionImportFormData => {
        const bucketName = (transaction.bucket || '').toLowerCase().trim();
        const bucketId = bucketNameToIdMap.get(bucketName);
        const bucketIdStr = bucketId ? bucketId.toString() : '';

        // MappedTransaction already uses TransactionImportFormData field names
        return {
          transaction_date: transaction.transaction_date,
          amount: Math.abs(transaction.amount),
          notes: transaction.notes || '',
          // If positive amount, set to_bucket_id; if negative, set from_bucket_id
          from_bucket_id:
            transaction.amount < 0
              ? bucketIdStr
              : transaction.from_bucket_id || '',
          to_bucket_id:
            transaction.amount >= 0
              ? bucketIdStr
              : transaction.to_bucket_id || '',
          import_status: transaction.import_status,
          should_import: transaction.should_import,
        };
      },
    );

    // Sort by transaction_date in ascending order (oldest first)
    return mapped.sort((a, b) => {
      return (
        new Date(a.transaction_date).getTime() -
        new Date(b.transaction_date).getTime()
      );
    });
  }, [transactions, bucketNameToIdMap]);

  useEffect(() => {
    setEditedTransactions(initialMappedTransactions);
  }, [initialMappedTransactions]);

  // Count transactions that will be imported
  const importCount = useMemo(() => {
    return editedTransactions.filter(
      (t) => t.should_import && t.import_status === 'ready',
    ).length;
  }, [editedTransactions]);

  // Single handler for updating transaction fields (including UI state)
  const handleUpdateTransaction = useCallback(
    (index: number, updatedFields: Partial<MappedTransaction>) => {
      setEditedTransactions((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          ...updatedFields,
        };
        return updated;
      });
    },
    [setEditedTransactions],
  );

  const handleImport = async () => {
    setBatchImportStatus('importing');
    setAlert(null); // Clear previous messages
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
      // Import each transaction based on should_import flag
      for (let index = 0; index < editedTransactions.length; index++) {
        const transaction = editedTransactions[index];

        // Skip if should_import is false or status is not ready
        if (
          !transaction.should_import ||
          transaction.import_status !== 'ready'
        ) {
          skipCount++;
          continue;
        }

        try {
          // Update status to importing
          setEditedTransactions((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              import_status: 'importing',
            };
            return updated;
          });

          const fromBucketId = transaction.from_bucket_id
            ? parseInt(transaction.from_bucket_id)
            : null;
          const toBucketId = transaction.to_bucket_id
            ? parseInt(transaction.to_bucket_id)
            : null;
          const notes = transaction.notes || null;

          // Create transaction
          await createTransaction({
            from_bucket_id: fromBucketId,
            to_bucket_id: toBucketId,
            amount: transaction.amount,
            transaction_date: new Date(
              transaction.transaction_date,
            ).toISOString(),
            notes: notes,
          }).unwrap();

          setEditedTransactions((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              import_status: 'success',
            };
            return updated;
          });

          successCount++;
        } catch (error) {
          console.error('Error importing transaction:', error);

          setEditedTransactions((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              import_status: 'error',
            };
            return updated;
          });
          errorCount++;
        }
      }

      // Show success message or error
      const messageParts = [`${successCount} imported`];
      if (skipCount > 0) {
        messageParts.push(`${skipCount} skipped`);
      }
      if (errorCount > 0) {
        messageParts.push(`${errorCount} failed`);
      }

      const message = `Import completed: ${messageParts.join(', ')}`;
      if (errorCount > 0) {
        setAlert({ message, severity: 'error' });
      } else if (skipCount > 0) {
        setAlert({ message, severity: 'info' });
      } else {
        setAlert({ message, severity: 'success' });
      }
    } catch {
      setAlert({
        message: 'Failed to import transactions. Please try again.',
        severity: 'error',
      });
    } finally {
      setBatchImportStatus('complete');
    }
  };

  const handleClose = () => {
    // Reset state on close
    setEditedTransactions([]);
    setBatchImportStatus('idle');
    setAlert(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
            Review and assign buckets to {initialMappedTransactions.length}{' '}
            transaction(s). Duplicate transactions will be automatically
            disabled.
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
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
                <TableCell sx={{ fontWeight: 'bold' }}>Import</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Transaction Date
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">
                  Transaction Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>From Bucket</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>To Bucket</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {initialMappedTransactions.map(
                (initialTransaction: MappedTransaction, index: number) => {
                  const editedTransaction = editedTransactions[index];
                  return (
                    <TransactionRow
                      key={index}
                      initialTransaction={initialTransaction}
                      index={index}
                      buckets={buckets}
                      importingStatus={
                        editedTransaction?.import_status === 'importing' ||
                        editedTransaction?.import_status === 'success' ||
                        editedTransaction?.import_status === 'error'
                          ? editedTransaction?.import_status
                          : undefined
                      }
                      onUpdateTransaction={handleUpdateTransaction}
                    />
                  );
                },
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {initialMappedTransactions.length === 0 && (
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
          }}
        >
          {alert && <Alert severity={alert.severity}>{alert.message}</Alert>}
          {batchImportStatus === 'complete' ? (
            <Button onClick={handleClose} variant="contained">
              Done
            </Button>
          ) : (
            <>
              <Button
                onClick={handleClose}
                variant="outlined"
                disabled={batchImportStatus === 'importing'}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                variant="contained"
                disabled={
                  batchImportStatus === 'importing' || importCount === 0
                }
                startIcon={
                  batchImportStatus === 'importing' ? (
                    <CircularProgress size={16} />
                  ) : null
                }
              >
                {batchImportStatus === 'importing'
                  ? 'Importing...'
                  : `Import Transactions (${importCount})`}
              </Button>
            </>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
