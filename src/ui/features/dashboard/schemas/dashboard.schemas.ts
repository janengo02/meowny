import { z } from 'zod';
import type { Dayjs } from 'dayjs';

export const chartFilterSchema = z
  .object({
    mode: z.enum(['month', 'year']),
    groupBy: z.enum(['bucket', 'category', 'account']),
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

export type ChartFilterFormData = z.infer<typeof chartFilterSchema>;

export const expensePieChartFormSchema = z.object({
  targetMonth: z.custom<Dayjs>((val) => val !== null && val !== undefined),
});

export type ExpensePieChartFormData = z.infer<typeof expensePieChartFormSchema>;

// Form schema
export const incomeVsSavingsChartFilterSchema = z
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

export type IncomeVsSavingsChartFilterFormData = z.infer<
  typeof incomeVsSavingsChartFilterSchema
>;
