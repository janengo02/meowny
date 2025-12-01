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
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Checkbox,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { type MappedTransaction } from './CsvImportFlow';
import { useAppSelector } from '../../../store/hooks';
import { formatMoney } from '../../../shared/utils';
import { useCreateTransactionMutation } from '../api/transactionApi';

type ImportStatus =
  | 'validating'
  | 'ready'
  | 'duplicate_detected'
  | 'error'
  | 'importing'
  | 'success'
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
  const [duplicatesAllowed, setDuplicatesAllowed] = useState(false);
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
  const [editedTransactions, setEditedTransactions] = useState<
    MappedTransaction[]
  >(initialMappedTransactions);

  // Validation: Check if any transaction has should_import=true but no buckets selected
  const hasValidationErrors = useMemo(() => {
    return editedTransactions.some((transaction, index) => {
      const shouldImport = shouldImportFlags[index] ?? true;
      const hasNoBuckets =
        (!transaction.fromBucket || transaction.fromBucket.trim() === '') &&
        (!transaction.toBucket || transaction.toBucket.trim() === '');
      return shouldImport && hasNoBuckets;
    });
  }, [editedTransactions, shouldImportFlags]);

  // Count transactions that will be imported
  const importCount = useMemo(() => {
    return editedTransactions.filter((transaction, index) => {
      const shouldImport = shouldImportFlags[index] ?? true;
      const hasAtLeastOneBucket =
        (transaction.fromBucket && transaction.fromBucket.trim() !== '') ||
        (transaction.toBucket && transaction.toBucket.trim() !== '');
      return shouldImport && hasAtLeastOneBucket;
    }).length;
  }, [editedTransactions, shouldImportFlags]);

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

  const handleShouldImportChange = (index: number, shouldImport: boolean) => {
    setShouldImportFlags((prev) => ({
      ...prev,
      [index]: shouldImport,
    }));

    // // Re-validate status with the new shouldImport value
    // checkAndUpdateDuplicateStatus(
    //   index,
    //   editedTransactions[index],
    //   shouldImport,
    // );
  };

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

  // Check and update duplicate status for a specific transaction
  const checkAndUpdateDuplicateStatus = useCallback(
    async (
      index: number,
      transaction: MappedTransaction,
      shouldImportOverride?: boolean,
    ) => {
      // Check for validation errors first
      const shouldImport =
        shouldImportOverride ?? shouldImportFlags[index] ?? true;
      const hasNoBuckets =
        (!transaction.fromBucket || transaction.fromBucket.trim() === '') &&
        (!transaction.toBucket || transaction.toBucket.trim() === '');

      // If should_import is true and no buckets selected, set status to error
      if (shouldImport && hasNoBuckets) {
        setImportStatuses((prev) => ({
          ...prev,
          [index]: 'error',
        }));
        return;
      }

      // Only check duplicates if we have at least one bucket selected
      if (!transaction.fromBucket && !transaction.toBucket) {
        setImportStatuses((prev) => ({
          ...prev,
          [index]: 'ready',
        }));
        return;
      }

      // Set status to validating while checking
      setImportStatuses((prev) => ({
        ...prev,
        [index]: 'validating',
      }));

      const cleanAmount = transaction.transactionAmount.replace(/[^\d.-]/g, '');
      const amount = Math.abs(parseFloat(cleanAmount) || 0);
      const fromBucketId = transaction.fromBucket
        ? parseInt(transaction.fromBucket)
        : null;
      const toBucketId = transaction.toBucket
        ? parseInt(transaction.toBucket)
        : null;
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
        [index]: hasDuplicate ? 'duplicate_detected' : 'ready',
      }));

      // Update shouldImport flag based on duplicate status and duplicatesAllowed
      // Only update if we're not using an override (which means user manually changed it)
      if (
        hasDuplicate &&
        !duplicatesAllowed &&
        shouldImportOverride === undefined
      ) {
        setShouldImportFlags((prev) => ({
          ...prev,
          [index]: false,
        }));
      }
    },
    [shouldImportFlags, duplicatesAllowed, checkDuplicate],
  );

  const handleImport = async () => {
    setIsImporting(true);
    setAlertMessage(null); // Clear previous messages
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Reset import statuses
    const newStatuses: Record<number, ImportStatus> = {};
    editedTransactions.forEach((_, index) => {
      newStatuses[index] = 'ready';
    });
    setImportStatuses(newStatuses);

    try {
      // Import each transaction based on shouldImport flag
      for (let index = 0; index < editedTransactions.length; index++) {
        const transaction = editedTransactions[index];
        const shouldImport = shouldImportFlags[index] ?? true;

        // Skip if shouldImport is false
        if (!shouldImport) {
          newStatuses[index] = 'duplicate_skipped';
          setImportStatuses({ ...newStatuses });
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
          newStatuses[index] = 'error';
          setImportStatuses({ ...newStatuses });
          skipCount++;
          continue;
        }

        try {
          // Update status to importing
          newStatuses[index] = 'importing';
          setImportStatuses({ ...newStatuses });

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

          newStatuses[index] = 'success';
          setImportStatuses({ ...newStatuses });
          successCount++;
        } catch (error) {
          console.error('Error importing transaction:', error);
          newStatuses[index] = 'error';
          setImportStatuses({ ...newStatuses });
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
    }
  };

  useEffect(() => {
    setEditedTransactions(initialMappedTransactions);
    // Reset alert message when transactions change
    setAlertMessage(null);
    // Reset import statuses when transactions change
    const newStatuses: Record<number, ImportStatus> = {};
    const newShouldImportFlags: Record<number, boolean> = {};
    initialMappedTransactions.forEach((_, index) => {
      newStatuses[index] = 'validating'; // Set to validating initially
      newShouldImportFlags[index] = true; // Initially all transactions should be imported
    });
    setImportStatuses(newStatuses);
    setShouldImportFlags(newShouldImportFlags);

    // Check for duplicates on initial load
    const checkAllDuplicates = async () => {
      for (let index = 0; index < initialMappedTransactions.length; index++) {
        const transaction = initialMappedTransactions[index];
        const shouldImport = true; // Initially all are set to import
        const hasNoBuckets =
          (!transaction.fromBucket || transaction.fromBucket.trim() === '') &&
          (!transaction.toBucket || transaction.toBucket.trim() === '');

        // If should_import is true and no buckets selected, set status to error
        if (shouldImport && hasNoBuckets) {
          setImportStatuses((prev) => ({
            ...prev,
            [index]: 'error',
          }));
          continue;
        }

        // Only check duplicates if we have at least one bucket selected
        if (!transaction.fromBucket && !transaction.toBucket) {
          setImportStatuses((prev) => ({
            ...prev,
            [index]: 'ready',
          }));
          continue;
        }

        // Set status to validating while checking
        setImportStatuses((prev) => ({
          ...prev,
          [index]: 'validating',
        }));

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

        try {
          const isDuplicate = await window.electron.checkDuplicateTransaction({
            transaction_date: transaction.transactionDate,
            amount: amount,
            from_bucket_id: fromBucketId,
            to_bucket_id: toBucketId,
            notes: notes,
          });

          setImportStatuses((prev) => ({
            ...prev,
            [index]: isDuplicate ? 'duplicate_detected' : 'ready',
          }));

          // Update shouldImport flag based on duplicate status and duplicatesAllowed
          if (isDuplicate && !duplicatesAllowed) {
            setShouldImportFlags((prev) => ({
              ...prev,
              [index]: false,
            }));
          }
        } catch (error) {
          console.error('Error checking for duplicate:', error);
          setImportStatuses((prev) => ({
            ...prev,
            [index]: 'ready',
          }));
        }
      }
    };
    checkAllDuplicates();
  }, [initialMappedTransactions, duplicatesAllowed]);

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
        {alertMessage && (
          <Alert
            severity={alertSeverity}
            onClose={() => setAlertMessage(null)}
            sx={{ mb: 2 }}
          >
            {alertMessage}
          </Alert>
        )}

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
                const isDuplicate =
                  importStatuses[index] === 'duplicate_detected';
                const shouldImport = shouldImportFlags[index] ?? true;
                const isCheckboxDisabled = isDuplicate && !duplicatesAllowed;
                const hasNoBuckets =
                  (!transaction.fromBucket ||
                    transaction.fromBucket.trim() === '') &&
                  (!transaction.toBucket || transaction.toBucket.trim() === '');
                const showBucketError = shouldImport && hasNoBuckets;

                return (
                  <TableRow
                    key={index}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      opacity: shouldImport ? 1 : 0.5,
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        checked={shouldImport}
                        onChange={(e) =>
                          handleShouldImportChange(index, e.target.checked)
                        }
                        disabled={isImporting || isCheckboxDisabled}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{transaction.transactionDate}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: (() => {
                          const amount =
                            parseFloat(
                              transaction.transactionAmount.replace(
                                /[^\d.-]/g,
                                '',
                              ),
                            ) || 0;
                          if (amount > 0) return 'success.main';
                          if (amount < 0) return 'error.main';
                          return 'inherit';
                        })(),
                        fontWeight: 500,
                      }}
                    >
                      {formatMoney(
                        parseFloat(
                          transaction.transactionAmount.replace(/[^\d.-]/g, ''),
                        ) || 0,
                      )}
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={transaction.notes}
                        onChange={(e) =>
                          handleNotesChange(index, e.target.value)
                        }
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
                      <FormControl
                        size="small"
                        fullWidth
                        error={showBucketError}
                      >
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
                      <FormControl
                        size="small"
                        fullWidth
                        error={showBucketError}
                      >
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
                      {importStatuses[index] === 'validating' && (
                        <Chip
                          label="Validating..."
                          size="small"
                          variant="outlined"
                          icon={<CircularProgress size={12} />}
                        />
                      )}
                      {importStatuses[index] === 'ready' && (
                        <Chip
                          label="Ready"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
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
        <Button onClick={onClose} variant="outlined" disabled={isImporting}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={
            editedTransactions.length === 0 ||
            isImporting ||
            hasValidationErrors
          }
          startIcon={isImporting ? <CircularProgress size={16} /> : null}
        >
          {isImporting
            ? 'Importing...'
            : `Import Transactions (${importCount})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
