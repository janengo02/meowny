import React, { useCallback, useEffect } from 'react';
import { TableRow, TableCell, Chip, CircularProgress } from '@mui/material';
import {
  useForm,
  FormProvider,
  useWatch,
  useFormContext,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSelectField } from '../../../shared/components/form/FormSelectField';
import { FormTextField } from '../../../shared/components/form/FormTextField';
import { FormCheckbox } from '../../../shared/components/form/FormCheckbox';
import { FormMoneyInput } from '../../../shared/components/form/FormMoneyInput';
import {
  transactionImportSchema,
  type ImportStatus,
  type MappedTransaction,
  type TransactionImportFormData,
} from '../schemas/transaction.schema';
import { checkDuplicate } from '../utils/checkDuplicate';
import { formatDateForDB } from '../../../shared/utils/dateTime';

interface Bucket {
  id: number;
  name: string;
}

interface TransactionRowProps {
  initialTransaction: MappedTransaction;
  index: number;
  buckets: Bucket[];
  isBatchImporting: boolean;
  importResult?: 'importing' | 'success' | 'error'; // Status during/after import process
  onUpdateTransaction: (
    index: number,
    updatedFields: Partial<MappedTransaction>,
  ) => void;
}

// Inner component that uses FormContext
const TransactionRowContent = React.memo(
  ({
    index,
    buckets,
    isBatchImporting,
    importResult,
    onUpdateTransaction,
  }: TransactionRowProps) => {
    const { setValue, trigger } = useFormContext<TransactionImportFormData>();

    const shouldImportWatch = useWatch({ name: 'should_import' });
    const notesWatch = useWatch({ name: 'notes' });
    const fromBucketIdWatch = useWatch({ name: 'from_bucket_id' });
    const toBucketIdWatch = useWatch({ name: 'to_bucket_id' });
    const importStatusWatch = useWatch({ name: 'import_status' });
    const transactionDateWatch = useWatch({ name: 'transaction_date' });
    const amountWatch = useWatch({ name: 'amount' }); // Still needed for validation

    const validateTransaction = useCallback(
      async (
        transactionDateWatch: string,
        amountWatch: number,
        notesWatch: string,
        fromBucketIdWatch: string,
        toBucketIdWatch: string,
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
        const amount = Math.abs(amountWatch);
        const fromBucketId = fromBucketIdWatch
          ? parseInt(fromBucketIdWatch)
          : null;
        const toBucketId = toBucketIdWatch ? parseInt(toBucketIdWatch) : null;
        const notesValue = notesWatch || null;

        try {
          const hasDuplicate = await checkDuplicate(
            formatDateForDB(transactionDateWatch),
            amount,
            fromBucketId,
            toBucketId,
            notesValue,
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
      [setValue, index, onUpdateTransaction, trigger],
    );

    useEffect(() => {
      if (isBatchImporting || importResult) return; // Skip validation if already importing or imported
      validateTransaction(
        transactionDateWatch,
        amountWatch,
        notesWatch,
        fromBucketIdWatch,
        toBucketIdWatch,
      );
    }, [
      transactionDateWatch,
      amountWatch,
      notesWatch,
      fromBucketIdWatch,
      toBucketIdWatch,
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

    // Convert buckets to options format for FormSelectField
    const bucketOptions = [
      { value: '', label: 'None' },
      ...buckets.map((bucket) => ({
        value: bucket.id.toString(),
        label: bucket.name,
      })),
    ];

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
          <FormTextField
            name="transaction_date"
            type="datetime-local"
            variant="standard"
            size="small"
            disabled={isBatchImporting || !!importResult}
            slotProps={{
              input: {
                disableUnderline: true,
              },
            }}
          />
        </TableCell>
        <TableCell align="right">
          <FormMoneyInput
            name="amount"
            disabled={isBatchImporting || !!importResult}
            allowNegative={false}
          />
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
        <TableCell>
          <FormSelectField
            name="from_bucket_id"
            label=""
            options={bucketOptions}
            size="small"
            displayEmpty
            disabled={isBatchImporting || !!importResult}
            sx={{
              opacity: fromBucketIdWatch ? 1 : 0.5,
            }}
          />
        </TableCell>
        <TableCell>
          <FormSelectField
            name="to_bucket_id"
            label=""
            options={bucketOptions}
            size="small"
            displayEmpty
            disabled={isBatchImporting || !!importResult}
            sx={{
              opacity: toBucketIdWatch ? 1 : 0.5,
            }}
          />
        </TableCell>
        <TableCell>
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
      transaction_date: props.initialTransaction.transaction_date,
      amount: props.initialTransaction.amount,
      notes: props.initialTransaction.notes || '',
      from_bucket_id: props.initialTransaction.from_bucket_id,
      to_bucket_id: props.initialTransaction.to_bucket_id,
      import_status: props.initialTransaction.import_status,
      should_import: props.initialTransaction.should_import,
    },
  });

  return (
    <FormProvider {...methods}>
      <TransactionRowContent {...props} />
    </FormProvider>
  );
});

TransactionRow.displayName = 'TransactionRow';
