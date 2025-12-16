import { z } from 'zod';

// Base schema for transaction data (without UI state)
export const baseTransactionSchema = z
  .object({
    transaction_date: z.string().min(1, { message: 'Date is required' }),
    amount: z
      .number({ message: 'Amount is required' })
      .positive({ message: 'Amount must be greater than 0' }),
    notes: z.string().optional(),
    from_bucket_id: z.string().optional(),
    to_bucket_id: z.string().optional(),
    from_units: z.number().positive().optional(),
    to_units: z.number().positive().optional(),
  })
  .refine((data) => data.from_bucket_id || data.to_bucket_id, {
    message: 'At least one bucket (From or To) must be selected',
    path: ['to_bucket_id', 'from_bucket_id'],
  });

export type BaseTransactionFormData = z.infer<typeof baseTransactionSchema>;

const importStatusSchema = z.enum([
  'validating',
  'ready',
  'invalid',
  'duplicate_detected',
  'importing',
  'success',
  'error',
  'duplicate_skipped',
  'duplicate_imported',
]);

export type ImportStatus = z.infer<typeof importStatusSchema>;

// Extended schema with UI state for CSV import
export const transactionImportSchema = baseTransactionSchema.safeExtend({
  import_status: importStatusSchema,
  should_import: z.boolean(),
});

// Manually define type to ensure UI state fields are required
export type TransactionImportFormData = z.infer<typeof transactionImportSchema>;

// Validation schema - transactionDate and either depositAmount or withdrawalAmount are required
export const columnMappingSchema = z
  .object({
    transactionDate: z.string().min(1, 'Transaction date column is required'),
    depositAmount: z.string().optional(),
    withdrawalAmount: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => data.depositAmount || data.withdrawalAmount,
    {
      message: 'At least one of Deposit Amount or Withdrawal Amount column is required',
      path: ['depositAmount'],
    },
  );
export type ColumnMappingFormData = z.infer<typeof columnMappingSchema>;

export type MappedTransaction = TransactionImportFormData & {
  suggested_bucket_id?: number | null; // Optional: Bucket ID suggested by keyword mapping
  is_deposit?: boolean; // Track if this transaction is a deposit (for display purposes)
};
