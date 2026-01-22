import { z } from "zod";

const categorySchema = z.object({
  name: z.string(),
  amount: z.number(),
  percentage: z.number(),
});

const monthlyDataSchema = z.object({
  month: z.string(),
  income: z.number(),
  expense: z.number(),
});

export const analysisResultSchema = z.object({
  summary: z.object({
    totalIncome: z.number(),
    totalExpense: z.number(),
    netCashflow: z.number(),
    periodStart: z.string(),
    periodEnd: z.string(),
    currency: z.string().default("MNT"),
  }),
  monthlyBreakdown: z.array(monthlyDataSchema),
  topIncomeCategories: z.array(categorySchema),
  topExpenseCategories: z.array(categorySchema),
  insights: z.array(z.string()),
  warnings: z.array(z.string()).optional(),
  bankName: z.string().nullable(),
});

export type AnalysisResultSchema = z.infer<typeof analysisResultSchema>;
