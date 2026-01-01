import type { Dayjs } from 'dayjs';
import { z } from 'zod';

export const marketValueSchema = z.object({
  market_value: z.number().min(0, 'Market value must be 0 or greater'),
  recorded_at: z.custom<Dayjs>((val) => val !== null && val !== undefined),
  notes: z.string().optional(),
});
export type MarketValueFormData = z.infer<typeof marketValueSchema>;

export const bucketChartFilterSchema = z
  .object({
    mode: z.enum(['month', 'year']),
    periodFrom: z.custom<Dayjs>((val) => val !== null && val !== undefined),
    periodTo: z.custom<Dayjs>((val) => val !== null && val !== undefined),
  })
  .refine(
    (data) =>
      data.periodFrom.isBefore(data.periodTo) ||
      data.periodFrom.isSame(data.periodTo),
    {
      message: 'Start date must be before or equal to end date',
      path: ['periodTo'],
    },
  );

export type BucketChartFilterFormData = z.infer<typeof bucketChartFilterSchema>;

export const addAssetBucketSchema = z.object({
  name: z.string().min(1, 'Bucket name is required').trim(),
  type: z.enum(['saving', 'investment']),
  account_id: z.number({ message: 'Account is required' }),
});

export type AddBucketFormData = z.infer<typeof addAssetBucketSchema>;
