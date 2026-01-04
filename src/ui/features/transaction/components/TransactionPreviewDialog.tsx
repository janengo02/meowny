import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { useBatchCreateTransactionsMutation } from '../api/transactionApi';
import { useGetBucketsQuery } from '../../bucket/api/bucketApi';
import { TransactionRow } from './TransactionRow';
import { type MappedTransaction } from '../schemas/transaction.schema';
import { formatDateForDB } from '../../../shared/utils/dateTime';
interface TransactionPreviewDialogProps {
  open: boolean;
  initialMappedTransactions: MappedTransaction[];
  onClose: () => void;
  onBack: () => void;
}

export function TransactionPreviewDialog({
  open,
  initialMappedTransactions,
  onClose,
  onBack,
}: TransactionPreviewDialogProps) {
  const [batchCreateTransactions] = useBatchCreateTransactionsMutation();
  const { data: buckets = [] } = useGetBucketsQuery();
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

  // Create a bucket type map for quick lookup
  const bucketTypeMap = useMemo(() => {
    const map = new Map<number, BucketTypeEnum>();
    buckets.forEach((bucket) => {
      map.set(bucket.id, bucket.type);
    });
    return map;
  }, [buckets]);

  useEffect(() => {
    setEditedTransactions(initialMappedTransactions);
  }, [initialMappedTransactions]);

  // Set up progress event listener for real-time status updates
  useEffect(() => {
    const unsubscribe = window.electron.onBatchCreateTransactionsProgress(
      (progress) => {
        // Update transaction status in real-time as each one completes
        const lastTransaction = progress.lastTransaction;
        if (!lastTransaction) return;

        setEditedTransactions((prev) => {
          const updated = [...prev];
          const transactionsToImport = prev.filter(
            (t) => t.should_import && t.import_status !== 'ready',
          );

          // Find the transaction in the importing list by its original index
          const transactionInList = transactionsToImport.find((_, idx) => {
            // The lastTransaction.index corresponds to the position in paramsArray
            // which matches the order of transactionsToImport
            return idx === lastTransaction.index;
          });

          if (transactionInList) {
            const originalIndex = prev.indexOf(transactionInList);
            if (originalIndex !== -1) {
              updated[originalIndex] = {
                ...updated[originalIndex],
                import_status:
                  lastTransaction.status === 'success' ? 'success' : 'error',
                error_message: lastTransaction.error,
              };
            }
          }

          return updated;
        });
      },
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Count transactions that will be imported
  const importCount = useMemo(() => {
    return editedTransactions.filter(
      (t) => t?.should_import && t?.import_status === 'ready',
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
    let skipCount = 0;

    try {
      // Prepare batch of transactions to import
      const transactionsToImport: Array<{
        index: number;
        params: CreateTransactionParams;
      }> = [];

      editedTransactions.forEach((transaction, index) => {
        // Skip if should_import is false or status is not ready
        if (
          !transaction.should_import ||
          transaction.import_status !== 'ready'
        ) {
          skipCount++;
          return;
        }

        const fromBucketId = transaction.from_bucket_id
          ? parseInt(transaction.from_bucket_id)
          : null;
        const toBucketId = transaction.to_bucket_id
          ? parseInt(transaction.to_bucket_id)
          : null;
        const notes = transaction.notes || null;
        const fromUnits = transaction.from_units || null;
        const toUnits = transaction.to_units || null;

        transactionsToImport.push({
          index,
          params: {
            from_bucket_id: fromBucketId,
            to_bucket_id: toBucketId,
            amount: transaction.amount,
            transaction_date: formatDateForDB(transaction.transaction_date),
            notes: notes,
            from_units: fromUnits,
            to_units: toUnits,
          },
        });
      });

      // Update all transactions to importing status
      setEditedTransactions((prev) => {
        const updated = [...prev];
        transactionsToImport.forEach(({ index }) => {
          updated[index] = {
            ...updated[index],
            import_status: 'importing',
          };
        });
        return updated;
      });

      // Batch create all transactions
      // Transaction statuses are updated in real-time via progress event listener
      const paramsArray = transactionsToImport.map((t) => t.params);
      const result = await batchCreateTransactions(paramsArray).unwrap();

      // Get final counts from result
      const successCount = result.successCount;
      const failedCount = result.failedCount;

      // Show appropriate message based on results
      const messageParts: string[] = [];
      if (successCount > 0) {
        messageParts.push(`${successCount} imported`);
      }
      if (failedCount > 0) {
        messageParts.push(`${failedCount} failed`);
      }
      if (skipCount > 0) {
        messageParts.push(`${skipCount} skipped`);
      }

      const message = `Import completed: ${messageParts.join(', ')}`;
      setAlert({
        message,
        severity:
          failedCount > 0 ? 'error' : skipCount > 0 ? 'info' : 'success',
      });
    } catch (error) {
      console.error('Error importing transactions:', error);

      // Update all importing transactions to error status
      setEditedTransactions((prev) => {
        const updated = [...prev];
        updated.forEach((transaction, index) => {
          if (transaction.import_status === 'importing') {
            updated[index] = {
              ...updated[index],
              import_status: 'error',
              error_message:
                error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });
        return updated;
      });

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
      maxWidth="xl"
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
          <Typography variant="h3">Transaction Preview</Typography>
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
                <TableCell sx={{ fontWeight: 'bold', width: 200 }}>
                  Transaction Date
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                <TableCell
                  sx={{ fontWeight: 'bold', width: 150 }}
                  align="right"
                >
                  Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 150 }}>
                  Units
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>From Bucket</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>To Bucket</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 130 }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editedTransactions.map(
                (editedTransaction: MappedTransaction, index: number) => {
                  const initialTransaction = initialMappedTransactions[index];
                  return (
                    <TransactionRow
                      key={index}
                      initialTransaction={initialTransaction}
                      index={index}
                      isBatchImporting={
                        batchImportStatus === 'importing' ||
                        batchImportStatus === 'complete'
                      }
                      importResult={
                        editedTransaction?.import_status === 'importing' ||
                        editedTransaction?.import_status === 'success' ||
                        editedTransaction?.import_status === 'error'
                          ? editedTransaction?.import_status
                          : undefined
                      }
                      bucketTypeMap={bucketTypeMap}
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
          <Box sx={{ display: 'flex', gap: 1 }}>
            {batchImportStatus !== 'complete' && (
              <Button
                onClick={onBack}
                variant="outlined"
                disabled={batchImportStatus === 'importing'}
              >
                Change Column Mapping
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
            {alert && <Alert severity={alert.severity}>{alert.message}</Alert>}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
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
        </Box>
      </DialogActions>
    </Dialog>
  );
}
