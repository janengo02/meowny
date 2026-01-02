import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import {
  useForm,
  FormProvider,
  useWatch,
  useFormContext,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormBucketSelectField } from '../../../shared/components/form/FormBucketSelectField';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { FormCheckbox } from '../../../shared/components/form/FormCheckbox';
import { FormMoneyInput } from '../../../shared/components/form/FormMoneyInput';
import { FormNumberInput } from '../../../shared/components/form/FormNumberInput';
import { DateTimePickerField } from '../../../shared/components/form/DateTimePickerField';
import {
  transactionImportSchema,
  type ImportStatus,
  type MappedTransaction,
  type TransactionImportFormData,
} from '../schemas/transaction.schema';
import { checkDuplicate } from '../utils/checkDuplicate';
import { formatDateForDB } from '../../../shared/utils/dateTime';

interface TransactionRowProps {
  initialTransaction: MappedTransaction;
  index: number;
  isBatchImporting: boolean;
  importResult?: 'importing' | 'success' | 'error'; // Status during/after import process
  bucketTypeMap: Map<number, BucketTypeEnum>;
  onUpdateTransaction: (
    index: number,
    updatedFields: Partial<MappedTransaction>,
  ) => void;
}

// Inner component that uses FormContext
const TransactionRowContent = React.memo(
  ({
    initialTransaction,
    index,
    isBatchImporting,
    importResult,
    bucketTypeMap,
    onUpdateTransaction,
  }: TransactionRowProps) => {
    const { setValue, trigger } = useFormContext<TransactionImportFormData>();
    const [selectedCell, setSelectedCell] = useState<'from' | 'to' | null>(
      null,
    );
    const fromCellRef = useRef<HTMLTableCellElement>(null);
    const toCellRef = useRef<HTMLTableCellElement>(null);

    const shouldImportWatch = useWatch({ name: 'should_import' });
    const notesWatch = useWatch({ name: 'notes' });
    const fromBucketIdWatch = useWatch({ name: 'from_bucket_id' });
    const toBucketIdWatch = useWatch({ name: 'to_bucket_id' });
    const importStatusWatch = useWatch({ name: 'import_status' });
    const transactionDateWatch = useWatch({ name: 'transaction_date' });
    const amountWatch = useWatch({ name: 'amount' }); // Still needed for validation
    const fromUnitsWatch = useWatch({ name: 'from_units' });
    const toUnitsWatch = useWatch({ name: 'to_units' });

    // Determine if units fields should be shown based on bucket types
    const fromBucketType = fromBucketIdWatch
      ? bucketTypeMap.get(parseInt(fromBucketIdWatch))
      : undefined;
    const toBucketType = toBucketIdWatch
      ? bucketTypeMap.get(parseInt(toBucketIdWatch))
      : undefined;

    const showFromUnits = fromBucketType === 'investment';
    const showToUnits = toBucketType === 'investment';

    // Update units fields when bucket type changes
    useEffect(() => {
      const defaultUnit = initialTransaction.default_unit ?? null;

      // Update from_units: use default_unit if bucket is investment and from_units is empty
      if (showFromUnits) {
        setValue('from_units', defaultUnit);
      } else {
        // Clear from_units if bucket is not investment
        setValue('from_units', undefined);
      }

      // Update to_units: use default_unit if bucket is investment and to_units is empty
      if (showToUnits) {
        setValue('to_units', defaultUnit);
      } else {
        setValue('to_units', undefined);
      }
    }, [showFromUnits, showToUnits, initialTransaction.default_unit, setValue]);

    const validateTransaction = useCallback(
      async (
        transactionDateWatch: dayjs.Dayjs,
        amountWatch: number,
        notesWatch: string,
        fromBucketIdWatch: string,
        toBucketIdWatch: string,
        fromUnitsWatch: number | undefined,
        toUnitsWatch: number | undefined,
      ) => {
        // Validate transaction
        const updatedFields = {
          transaction_date: transactionDateWatch,
          amount: amountWatch,
          notes: notesWatch,
          from_bucket_id: fromBucketIdWatch,
          to_bucket_id: toBucketIdWatch,
          import_status: 'validating' as ImportStatus,
          should_import: true,
          from_units: fromUnitsWatch || null,
          to_units: toUnitsWatch || null,
        };

        // Trigger validation and get the latest errors state
        const isValid = await trigger();
        const hasFormErrors = !isValid;

        if (hasFormErrors) {
          setValue('import_status', 'invalid');
          setValue('should_import', false);
          updatedFields.import_status = 'invalid' as ImportStatus;
          updatedFields.should_import = false;
          onUpdateTransaction(index, updatedFields);
          return;
        }
        setValue('import_status', 'validating');

        // Check if investment buckets have required units
        const fromBucketId = fromBucketIdWatch
          ? parseInt(fromBucketIdWatch)
          : null;
        const toBucketId = toBucketIdWatch ? parseInt(toBucketIdWatch) : null;

        const fromBucketType = fromBucketId
          ? bucketTypeMap.get(fromBucketId)
          : undefined;
        const toBucketType = toBucketId
          ? bucketTypeMap.get(toBucketId)
          : undefined;

        // Validate: if bucket is investment type, units must be positive
        if (
          fromBucketType === 'investment' &&
          (!fromUnitsWatch || fromUnitsWatch <= 0)
        ) {
          setValue('import_status', 'invalid');
          setValue('should_import', false);
          updatedFields.import_status = 'invalid' as ImportStatus;
          updatedFields.should_import = false;
          onUpdateTransaction(index, updatedFields);
          return;
        }

        if (
          toBucketType === 'investment' &&
          (!toUnitsWatch || toUnitsWatch <= 0)
        ) {
          setValue('import_status', 'invalid');
          setValue('should_import', false);
          updatedFields.import_status = 'invalid' as ImportStatus;
          updatedFields.should_import = false;
          onUpdateTransaction(index, updatedFields);
          return;
        }

        // Check for duplicate in the database
        const amount = Math.abs(amountWatch);
        const notesValue = notesWatch || null;

        try {
          const hasDuplicate = await checkDuplicate(
            formatDateForDB(transactionDateWatch),
            amount,
            fromBucketId,
            toBucketId,
            notesValue,
            fromUnitsWatch || null,
            toUnitsWatch || null,
          );

          const newStatus = hasDuplicate ? 'duplicate_detected' : 'ready';
          const newShouldImportFlags = !hasDuplicate;
          setValue('import_status', newStatus);
          setValue('should_import', newShouldImportFlags);
          updatedFields.import_status = newStatus as ImportStatus;
          updatedFields.should_import = newShouldImportFlags;
          onUpdateTransaction(index, updatedFields);
        } catch (error) {
          console.error('Error validating transaction:', error);
          setValue('import_status', 'error');
          setValue('should_import', false);
          updatedFields.import_status = 'error' as ImportStatus;
          updatedFields.should_import = false;
          onUpdateTransaction(index, updatedFields);
        }
      },
      [setValue, index, onUpdateTransaction, trigger, bucketTypeMap],
    );

    useEffect(() => {
      if (isBatchImporting || importResult) return; // Skip validation if already importing or imported
      validateTransaction(
        transactionDateWatch,
        amountWatch,
        notesWatch,
        fromBucketIdWatch,
        toBucketIdWatch,
        fromUnitsWatch,
        toUnitsWatch,
      );
    }, [
      transactionDateWatch,
      amountWatch,
      notesWatch,
      fromBucketIdWatch,
      toBucketIdWatch,
      fromUnitsWatch,
      toUnitsWatch,
      validateTransaction,
      isBatchImporting,
      importResult,
    ]);

    // Calculate if checkbox should be disabled - always disable duplicates
    const isDuplicate = importStatusWatch === 'duplicate_detected';
    const isInvalid = importStatusWatch === 'invalid';
    const isCheckboxDisabled =
      isDuplicate || isInvalid || isBatchImporting || !!importResult;

    const currentImportStatus = importResult || importStatusWatch;

    const handleShouldImportChange = (checked: boolean) => {
      const updatedFields = {
        should_import: checked,
      };
      onUpdateTransaction(index, updatedFields);
    };

    // Handle click outside to deselect
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          fromCellRef.current &&
          toCellRef.current &&
          !fromCellRef.current.contains(event.target as Node) &&
          !toCellRef.current.contains(event.target as Node)
        ) {
          setSelectedCell(null);
        }
      };

      if (selectedCell) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [selectedCell]);

    return (
      <TableRow
        sx={{
          '&:hover': {
            bgcolor: 'action.hover',
          },
          opacity: shouldImportWatch ? 1 : 0.5,
        }}
      >
        <TableCell>
          <FormCheckbox
            name="should_import"
            onValueChange={handleShouldImportChange}
            disabled={isCheckboxDisabled}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Box sx={{ width: 200 }}>
            <DateTimePickerField
              name="transaction_date"
              label=""
              size="small"
              disabled={isBatchImporting || !!importResult}
            />
          </Box>
        </TableCell>
        <TableCell>
          <FormTextField
            name="notes"
            variant="standard"
            size="small"
            disabled={isBatchImporting || !!importResult}
            placeholder="Add notes..."
            slotProps={{
              input: {
                disableUnderline: true,
              },
            }}
          />
        </TableCell>
        <TableCell align="right" sx={{ width: 150 }}>
          <Box
            sx={{
              color: initialTransaction.is_deposit
                ? 'success.main'
                : 'error.main',
            }}
          >
            <FormMoneyInput
              name="amount"
              disabled={isBatchImporting || !!importResult}
              allowNegative={false}
              variant="standard"
              size="small"
              textAlign="right"
              disableUnderline={true}
            />
          </Box>
        </TableCell>
        <TableCell sx={{ width: 150 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexDirection: 'column',
            }}
          >
            {!showFromUnits && !showToUnits && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontStyle: 'italic' }}
              >
                Select an investment bucket to enter units.
              </Typography>
            )}
            {showFromUnits && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Sell
                </Typography>
                <FormNumberInput
                  name="from_units"
                  disabled={isBatchImporting || !!importResult}
                  allowNegative={false}
                  variant="outlined"
                  size="small"
                  textAlign="right"
                  decimalScale={4}
                  placeholder="Units"
                />
              </Box>
            )}
            {showToUnits && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Buy
                </Typography>
                <FormNumberInput
                  name="to_units"
                  disabled={isBatchImporting || !!importResult}
                  allowNegative={false}
                  variant="outlined"
                  size="small"
                  textAlign="right"
                  decimalScale={4}
                  placeholder="Units"
                />
              </Box>
            )}
          </Box>
        </TableCell>
        <TableCell
          ref={fromCellRef}
          onClick={() => setSelectedCell('from')}
          sx={{
            position: 'relative',
            cursor: 'pointer',
            ...(selectedCell === 'from' && {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '-2px',
            }),
          }}
        >
          <FormBucketSelectField
            name="from_bucket_id"
            label=""
            size="small"
            disabled={isBatchImporting || !!importResult}
            sx={{
              opacity: fromBucketIdWatch ? 1 : 0.5,
              width: 180,
              '& .MuiSelect-select': {
                userSelect: 'text',
                cursor: 'text',
              },
            }}
            onCopy={(e) => {
              const value = fromBucketIdWatch || '';
              e.clipboardData.setData('text/plain', value);
              e.preventDefault();
            }}
            onPaste={(e) => {
              if (isBatchImporting || importResult) return;
              const pastedValue = e.clipboardData.getData('text/plain').trim();
              if (pastedValue && /^\d+$/.test(pastedValue)) {
                setValue('from_bucket_id', pastedValue);
                trigger();
                onUpdateTransaction(index, { from_bucket_id: pastedValue });
              }
              e.preventDefault();
            }}
          />
        </TableCell>
        <TableCell
          ref={toCellRef}
          onClick={() => setSelectedCell('to')}
          sx={{
            position: 'relative',
            cursor: 'pointer',
            ...(selectedCell === 'to' && {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '-2px',
            }),
          }}
        >
          <FormBucketSelectField
            name="to_bucket_id"
            label=""
            size="small"
            disabled={isBatchImporting || !!importResult}
            sx={{
              opacity: toBucketIdWatch ? 1 : 0.5,
              width: 180,
              '& .MuiSelect-select': {
                userSelect: 'text',
                cursor: 'text',
              },
            }}
            onCopy={(e) => {
              const value = toBucketIdWatch || '';
              e.clipboardData.setData('text/plain', value);
              e.preventDefault();
            }}
            onPaste={(e) => {
              if (isBatchImporting || importResult) return;
              const pastedValue = e.clipboardData.getData('text/plain').trim();
              if (pastedValue && /^\d+$/.test(pastedValue)) {
                setValue('to_bucket_id', pastedValue);
                trigger();
                onUpdateTransaction(index, { to_bucket_id: pastedValue });
              }
              e.preventDefault();
            }}
          />
        </TableCell>

        <TableCell sx={{ width: 130 }}>
          {currentImportStatus === 'validating' && (
            <Chip
              label="Validating..."
              size="small"
              variant="outlined"
              icon={<CircularProgress size={12} />}
            />
          )}
          {currentImportStatus === 'ready' && (
            <Chip
              label="Ready"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          {currentImportStatus === 'duplicate_detected' && (
            <Chip
              label="Duplicate Found"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          {currentImportStatus === 'importing' && (
            <Chip
              label="Importing..."
              size="small"
              color="info"
              icon={<CircularProgress size={12} />}
            />
          )}
          {currentImportStatus === 'success' && (
            <Chip label="Imported" size="small" color="success" />
          )}
          {currentImportStatus === 'duplicate_skipped' && (
            <Chip label="Duplicate Skipped" size="small" color="warning" />
          )}
          {currentImportStatus === 'duplicate_imported' && (
            <Chip label="Duplicate Imported" size="small" color="info" />
          )}
          {currentImportStatus === 'invalid' && (
            <Chip label="Invalid" size="small" color="error" />
          )}
          {currentImportStatus === 'error' && (
            <Chip label="Error" size="small" color="error" />
          )}
        </TableCell>
      </TableRow>
    );
  },
);

TransactionRowContent.displayName = 'TransactionRowContent';

// Outer component that provides FormProvider
export const TransactionRow = React.memo((props: TransactionRowProps) => {
  const methods = useForm<TransactionImportFormData>({
    resolver: zodResolver(transactionImportSchema),
    mode: 'onChange',
    defaultValues: {
      transaction_date: dayjs(props.initialTransaction.transaction_date),
      amount: props.initialTransaction.amount,
      notes: props.initialTransaction.notes || '',
      from_bucket_id: props.initialTransaction.from_bucket_id,
      to_bucket_id: props.initialTransaction.to_bucket_id,
      import_status: props.initialTransaction.import_status,
      should_import: props.initialTransaction.should_import,
      from_units: props.initialTransaction.from_units ?? undefined,
      to_units: props.initialTransaction.to_units ?? undefined,
    },
  });

  return (
    <FormProvider {...methods}>
      <TransactionRowContent {...props} />
    </FormProvider>
  );
});

TransactionRow.displayName = 'TransactionRow';
