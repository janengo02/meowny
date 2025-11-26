import { z } from 'zod';

export const transactionSchema = z
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
  .refine(
    (data) => data.from_bucket_id || data.to_bucket_id,
    {
      message: 'At least one bucket (From or To) must be selected',
      path: ['to_bucket_id'],
    },
  );

export type TransactionFormData = z.infer<typeof transactionSchema>;
