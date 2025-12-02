import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { type MappedTransaction } from './CsvImportFlow';
import { useAppSelector } from '../../../store/hooks';
import { useCreateTransactionMutation } from '../api/transactionApi';
import { TransactionRow } from './TransactionRow';

type ImportStatus =
  | 'validating'
  | 'ready'
  | 'invalid'
  | 'duplicate_detected'
  | 'importing'
  | 'success'
  | 'error'
  | 'duplicate_skipped'
  | 'duplicate_imported';

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
  const [isImporting, setIsImporting] = useState(false);
  const [isImportComplete, setIsImportComplete] = useState(false);
  const [importStatuses, setImportStatuses] = useState<
    Record<number, ImportStatus>
  >({});
  const [shouldImportFlags, setShouldImportFlags] = useState<
    Record<number, boolean>
  >({});
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<
    'success' | 'error' | 'info'
  >('info');




  // Set edited transactions to the initial transactions
  const [editedTransactions, setEditedTransactions] = useState<
    MappedTransaction[]
  >([]);

  // Count transactions that will be imported
  const importCount = useMemo(() => {
    return editedTransactions.filter((_, index) => {
      const shouldImport = shouldImportFlags[index] ?? true;
      const isValidStatus = importStatuses[index] === 'ready' || importStatuses[index] === 'duplicate_detected';
      return shouldImport && isValidStatus;
    }).length;
  }, [editedTransactions, importStatuses, shouldImportFlags]);

  // Single handler for updating transaction fields
  const handleUpdateTransaction = useCallback((
    index: number,
    field: keyof MappedTransaction,
    value: string,
  ) => {
    setEditedTransactions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleShouldImportChange = useCallback((index: number, shouldImport: boolean) => {
    setShouldImportFlags((prev) => ({
      ...prev,
      [index]: shouldImport,
    }));
  }, []);

  // Check if a transaction is a duplicate using the API
  const checkDuplicate = useCallback(
    async (
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
    },
    [],
  );

  // Handler for status changes from child rows
  const handleStatusChange = useCallback((index: number, status: ImportStatus) => {
    setImportStatuses((prev) => ({
      ...prev,
      [index]: status,
    }));
  }, []);

  const handleImport = async () => {
    setIsImporting(true);
    setAlertMessage(null); // Clear previous messages
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
      // Import each transaction based on shouldImport flag
      for (let index = 0; index < editedTransactions.length; index++) {
        const transaction = editedTransactions[index];
        const shouldImport = shouldImportFlags[index] ?? true;

        // Skip if shouldImport is false
        if (!shouldImport) {
          skipCount++;
          continue;
        }

        // Skip if no bucket selected
        if (
          !(
            (transaction.fromBucket && transaction.fromBucket.trim() !== '') ||
            (transaction.toBucket && transaction.toBucket.trim() !== '')
          )
        ) {
          skipCount++;
          continue;
        }

        try {
          // Update status to importing
          setImportStatuses((prev) => ({
            ...prev,
            [index]: 'importing',
          }));

          // Parse amount and remove any non-numeric characters (like commas, currency symbols)
          const cleanAmount = transaction.transactionAmount.replace(
            /[^\d.-]/g,
            '',
          );
          const amount = Math.abs(parseFloat(cleanAmount) || 0);

          const fromBucketId = transaction.fromBucket
            ? parseInt(transaction.fromBucket)
            : null;
          const toBucketId = transaction.toBucket
            ? parseInt(transaction.toBucket)
            : null;
          const notes = transaction.notes || null;

          // Create transaction
          await createTransaction({
            from_bucket_id: fromBucketId,
            to_bucket_id: toBucketId,
            amount: amount,
            transaction_date: transaction.transactionDate,
            notes: notes,
          }).unwrap();

          setImportStatuses((prev) => ({
            ...prev,
            [index]: 'success',
          }));
          successCount++;
        } catch (error) {
          console.error('Error importing transaction:', error);
          setImportStatuses((prev) => ({
            ...prev,
            [index]: 'error',
          }));
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
        setAlertSeverity('error');
      } else if (skipCount > 0) {
        setAlertSeverity('info');
      } else {
        setAlertSeverity('success');
      }
      setAlertMessage(message);
    } catch {
      setAlertSeverity('error');
      setAlertMessage('Failed to import transactions. Please try again.');
    } finally {
      setIsImporting(false);
      setIsImportComplete(true);
    }
  };

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

  useEffect(() => {
    // Reset import statuses when transactions change
    const newStatuses: Record<number, ImportStatus> = {};
    const newShouldImportFlags: Record<number, boolean> = {};
    initialMappedTransactions.forEach((_, index) => {
      newStatuses[index] = 'validating'; // Set to validating initially
      newShouldImportFlags[index] = true; // Initially all transactions should be imported
    });


    setEditedTransactions(initialMappedTransactions);
    setImportStatuses(newStatuses);
    setShouldImportFlags(newShouldImportFlags);
    // Initial validation is now handled by each TransactionRow component on mount
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
            transaction(s). Duplicate transactions will be automatically disabled.
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
                <TableCell sx={{ fontWeight: 'bold', width: 100 }}>
                  Import
                </TableCell>
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
              {editedTransactions.map((transaction, index) => {
                const importingStatus = importStatuses[index];

                return (
                  <TransactionRow
                    key={index}
                    transaction={transaction}
                    index={index}
                    buckets={buckets}
                    isImporting={isImporting}
                    isImportComplete={isImportComplete}
                    importingStatus={
                      importingStatus === 'importing' ||
                      importingStatus === 'success' ||
                      importingStatus === 'error'
                        ? importingStatus
                        : undefined
                    }
                    onUpdateTransaction={handleUpdateTransaction}
                    onStatusChange={handleStatusChange}
                    onShouldImportChange={handleShouldImportChange}
                    checkDuplicate={checkDuplicate}
                  />
                );
              })}
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
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
        {alertMessage && (
          <Alert
            severity={alertSeverity}
            onClose={() => setAlertMessage(null)}
          >
            {alertMessage}
          </Alert>
        )}
        {isImportComplete ? (
          <Button onClick={onClose} variant="contained">
            Done
          </Button>
        ) : (
          <>
            <Button onClick={onClose} variant="outlined" disabled={isImporting}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              variant="contained"
              disabled={
                isImporting ||
                importCount === 0
              }
              startIcon={isImporting ? <CircularProgress size={16} /> : null}
            >
              {isImporting
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
