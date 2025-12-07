import type { Dayjs } from 'dayjs';
import { z } from 'zod';

export const marketValueSchema = z.object({
  market_value: z.number().min(0, 'Market value must be 0 or greater'),
  recorded_at: z.custom<Dayjs>((val) => val !== null && val !== undefined),
  notes: z.string().optional(),
});
export type MarketValueFormData = z.infer<typeof marketValueSchema>;
