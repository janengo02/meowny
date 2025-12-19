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
    from_units: z.number().positive().nullable().optional(),
    to_units: z.number().positive().nullable().optional(),
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

// Amount mapping strategy types
export const amountMappingStrategySchema = z.enum([
  'single_transaction', // Option 1: Single transaction amount column
  'deposit_withdrawal', // Option 2: Separate deposit/withdrawal columns
  'transaction_with_category', // Option 3: Transaction amount + category column
]);
export type AmountMappingStrategy = z.infer<typeof amountMappingStrategySchema>;

// Validation schema for column mapping - varies based on strategy
export const columnMappingSchema = z.discriminatedUnion('strategy', [
  // Option 1: Single transaction column
  z.object({
    strategy: z.literal('single_transaction'),
    transactionDate: z.string().min(1, 'Transaction date column is required'),
    transactionAmount: z
      .string()
      .min(1, 'Transaction amount column is required'),
    notes: z.string().optional(),
    units: z.string().optional(),
  }),
  // Option 2: Separate deposit/withdrawal columns
  z.object({
    strategy: z.literal('deposit_withdrawal'),
    transactionDate: z.string().min(1, 'Transaction date column is required'),
    depositAmount: z.string().min(1, 'Deposit amount column is required'),
    withdrawalAmount: z.string().min(1, 'Withdrawal amount column is required'),
    notes: z.string().optional(),
    units: z.string().optional(),
  }),
  // Option 3: Transaction amount + category column
  z
    .object({
      strategy: z.literal('transaction_with_category'),
      transactionDate: z.string().min(1, 'Transaction date column is required'),
      transactionAmount: z
        .string()
        .min(1, 'Transaction amount column is required'),
      categoryColumn: z.string().min(1, 'Category column is required'),
      depositValue: z.string().min(1, 'Deposit value is required'),
      withdrawalValue: z.string().min(1, 'Withdrawal value is required'),
      notes: z.string().optional(),
      units: z.string().optional(),
    })
    .refine((data) => data.depositValue !== data.withdrawalValue, {
      message: 'Deposit and Withdrawal values must be different',
      path: ['withdrawalValue'],
    }),
]);
export type ColumnMappingFormData = z.infer<typeof columnMappingSchema>;

export type MappedTransaction = TransactionImportFormData & {
  suggested_bucket_id?: number | null; // Optional: Bucket ID suggested by keyword mapping
  is_deposit?: boolean; // Track if this transaction is a deposit (for display purposes)
  default_unit?: number | null; // Default units value from CSV import
};
