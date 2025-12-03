import { z } from 'zod';

export type ImportStatus =
  | 'validating'
  | 'ready'
  | 'invalid'
  | 'duplicate_detected'
  | 'importing'
  | 'success'
  | 'error'
  | 'duplicate_skipped'
  | 'duplicate_imported';

// Base schema for transaction data (without UI state)
export const baseTransactionSchema = z
  .object({
    from_bucket_id: z.string().optional(),
    to_bucket_id: z.string().optional(),
    amount: z
      .string()
      .min(1, { message: 'Amount is required' })
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: 'Amount must be greater than 0',
      }),
    transaction_date: z.string().min(1, { message: 'Date is required' }),
    notes: z.string().optional(),
  })
  .refine((data) => data.from_bucket_id || data.to_bucket_id, {
    message: 'At least one bucket (From or To) must be selected',
    path: ['to_bucket_id'],
  });

export type BaseTransactionFormData = z.infer<typeof baseTransactionSchema>;

// Extended schema with UI state for CSV import
export const transactionSchema = baseTransactionSchema.safeExtend({
  import_status: z.enum([
    'validating',
    'ready',
    'invalid',
    'duplicate_detected',
    'importing',
    'success',
    'error',
    'duplicate_skipped',
    'duplicate_imported',
  ]),
  should_import: z.boolean(),
});

// Manually define type to ensure UI state fields are required
export type TransactionFormData = z.infer<typeof baseTransactionSchema> & {
  import_status: ImportStatus;
  should_import: boolean;
};

// Schema for forms with multiple transactions (e.g., CSV import)
export const transactionArraySchema = z.object({
  transactions: z.array(transactionSchema),
});

export type TransactionArrayFormData = z.infer<typeof transactionArraySchema>;
