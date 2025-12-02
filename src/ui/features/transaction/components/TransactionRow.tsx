import React, { useState } from 'react';
import {
  TableRow,
  TableCell,
  Checkbox,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
} from '@mui/material';
import { type SelectChangeEvent } from '@mui/material';
import { type MappedTransaction } from './CsvImportFlow';
import { formatMoney } from '../../../shared/utils';

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

interface Bucket {
  id: number;
  name: string;
}

interface TransactionRowProps {
  transaction: MappedTransaction;
  index: number;
  buckets: Bucket[];
  isImporting: boolean;
  isImportComplete: boolean;
  importingStatus?: ImportStatus; // Optional: only used when parent triggers import
  onUpdateTransaction: (
    index: number,
    field: keyof MappedTransaction,
    value: string,
  ) => void;
  onStatusChange: (index: number, status: ImportStatus) => void;
  onShouldImportChange: (index: number, shouldImport: boolean) => void;
  checkDuplicate: (
    transactionDate: string,
    amount: number,
    fromBucketId: number | null,
    toBucketId: number | null,
    notes: string | null,
  ) => Promise<boolean>;
}

export const TransactionRow = React.memo(
  ({
    transaction,
    index,
    buckets,
    isImporting,
    isImportComplete,
    importingStatus,
    onUpdateTransaction,
    onStatusChange,
    onShouldImportChange,
    checkDuplicate,
  }: TransactionRowProps) => {
    // Local state for uncontrolled inputs, status, and import flag
    const [localNotes, setLocalNotes] = useState(transaction.notes);
    const [localFromBucket, setLocalFromBucket] = useState(transaction.fromBucket);
    const [localToBucket, setLocalToBucket] = useState(transaction.toBucket);
    const [localStatus, setLocalStatus] = useState<ImportStatus>('validating');
    const [shouldImport, setShouldImport] = useState(true);

    // Sync local status when parent updates it (e.g., during import)
    React.useEffect(() => {
      if (importingStatus === 'importing' || importingStatus === 'success' || importingStatus === 'error') {
        setLocalStatus(importingStatus);
      }
    }, [importingStatus]);

    // Run initial validation on mount
    React.useEffect(() => {
      validateTransaction(localNotes, localFromBucket, localToBucket);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Auto-sync shouldImport based on status changes
    React.useEffect(() => {
      if (localStatus === 'ready') {
        setShouldImport(true);
        onShouldImportChange(index, true);
      } else if (localStatus === 'invalid' || localStatus === 'duplicate_detected') {
        setShouldImport(false);
        onShouldImportChange(index, false);
      }
    }, [localStatus, index, onShouldImportChange]);

    const hasNoBuckets =
      (!localFromBucket || localFromBucket.trim() === '') &&
      (!localToBucket || localToBucket.trim() === '');
    const showBucketError = shouldImport && hasNoBuckets;

    // Calculate if checkbox should be disabled - always disable duplicates
    const isDuplicate = localStatus === 'duplicate_detected';
    const isInvalid = localStatus === 'invalid';
    const isCheckboxDisabled = isDuplicate || isInvalid;

    // Validation function - runs locally
    const validateTransaction = async (
      notes: string,
      fromBucket: string,
      toBucket: string,
    ) => {
      const hasNoBuckets =
        (!fromBucket || fromBucket.trim() === '') &&
        (!toBucket || toBucket.trim() === '');

      if (hasNoBuckets) {
        setLocalStatus('invalid');
        onStatusChange(index, 'invalid');
        return;
      }

      setLocalStatus('validating');
      onStatusChange(index, 'validating');

      const cleanAmount = transaction.transactionAmount.replace(/[^\d.-]/g, '');
      const amount = Math.abs(parseFloat(cleanAmount) || 0);
      const fromBucketId = fromBucket ? parseInt(fromBucket) : null;
      const toBucketId = toBucket ? parseInt(toBucket) : null;
      const notesValue = notes || null;

      try {
        const hasDuplicate = await checkDuplicate(
          transaction.transactionDate,
          amount,
          fromBucketId,
          toBucketId,
          notesValue,
        );

        const newStatus = hasDuplicate ? 'duplicate_detected' : 'ready';
        setLocalStatus(newStatus);
        onStatusChange(index, newStatus);
        // shouldImport will be auto-synced by useEffect
      } catch (error) {
        console.error('Error validating transaction:', error);
        setLocalStatus('error');
        onStatusChange(index, 'error');
      }
    };

    const handleShouldImportChange = (checked: boolean) => {
      // Prevent enabling if duplicate detected
      if (isDuplicate && checked) {
        return;
      }
      setShouldImport(checked);
      onShouldImportChange(index, checked);
    };

    const handleNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setLocalNotes(value);
      setTimeout(() => {
        onUpdateTransaction(index, 'notes', value);
        validateTransaction(value, localFromBucket, localToBucket);
      }, 500);
    };

    const handleFromBucketChange = (event: SelectChangeEvent) => {
      const value = event.target.value;
      setLocalFromBucket(value);
      setTimeout(() => {
        onUpdateTransaction(index, 'fromBucket', value);
        validateTransaction(localNotes, value, localToBucket);
      }, 100);
    };

    const handleToBucketChange = (event: SelectChangeEvent) => {
      const value = event.target.value;
      setLocalToBucket(value);
      setTimeout(() => {
        onUpdateTransaction(index, 'toBucket', value);
        validateTransaction(localNotes, localFromBucket, value);
      }, 100);
    };

    return (
      <TableRow
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
            onChange={(e) => handleShouldImportChange(e.target.checked)}
            disabled={isImporting || isImportComplete || isCheckboxDisabled}
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
            parseFloat(transaction.transactionAmount.replace(/[^\d.-]/g, '')) ||
              0,
          )}
        </TableCell>
        <TableCell>
          <TextField
            value={localNotes}
            onChange={handleNotesChange}
            variant="standard"
            size="small"
            fullWidth
            disabled={isImporting || isImportComplete}
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
          <FormControl size="small" fullWidth error={showBucketError}>
            <Select
              value={localFromBucket}
              onChange={handleFromBucketChange}
              displayEmpty
              disabled={isImporting || isImportComplete}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {buckets.map((bucket) => (
                <MenuItem key={bucket.id} value={bucket.id.toString()}>
                  {bucket.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </TableCell>
        <TableCell>
          <FormControl size="small" fullWidth error={showBucketError}>
            <Select
              value={localToBucket}
              onChange={handleToBucketChange}
              displayEmpty
              disabled={isImporting || isImportComplete}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {buckets.map((bucket) => (
                <MenuItem key={bucket.id} value={bucket.id.toString()}>
                  {bucket.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </TableCell>
        <TableCell>
          {localStatus === 'validating' && (
            <Chip
              label="Validating..."
              size="small"
              variant="outlined"
              icon={<CircularProgress size={12} />}
            />
          )}
          {localStatus === 'ready' && (
            <Chip
              label="Ready"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          {localStatus === 'duplicate_detected' && (
            <Chip
              label="Duplicate Found"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          {localStatus === 'importing' && (
            <Chip
              label="Importing..."
              size="small"
              color="info"
              icon={<CircularProgress size={12} />}
            />
          )}
          {localStatus === 'success' && (
            <Chip label="Imported" size="small" color="success" />
          )}
          {localStatus === 'duplicate_skipped' && (
            <Chip
              label="Duplicate Skipped"
              size="small"
              color="warning"
            />
          )}
          {localStatus === 'duplicate_imported' && (
            <Chip
              label="Duplicate Imported"
              size="small"
              color="info"
            />
          )}
          {localStatus === 'invalid' && (
            <Chip label="Invalid" size="small" color="error" />
          )}
          {localStatus === 'error' && (
            <Chip label="Error" size="small" color="error" />
          )}
        </TableCell>
      </TableRow>
    );
  },
);

TransactionRow.displayName = 'TransactionRow';
