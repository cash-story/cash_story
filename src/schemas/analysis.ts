import { z } from "zod";

const monthlyDataSchema = z.object({
  month: z.string(),
  income: z.number(),
  expense: z.number(),
});

// Rating schema based on Ganbat model
const ratingSchema = z.object({
  grade: z.enum(["AA", "A", "B", "C", "D", "E"]),
  status_mn: z.string(),
  description: z.string(),
});

// Individual milestone schema
const milestoneSchema = z.object({
  amount_mnt: z.number(),
  years_to_reach: z.number(),
});

// All 4 milestones
const milestonesSchema = z.object({
  security: milestoneSchema,
  comfort: milestoneSchema,
  freedom: milestoneSchema,
  super_freedom: milestoneSchema,
});

// Investment strategy - Мянгат малчин
const strategySchema = z.object({
  philosophy: z.string(),
  advice_items: z.array(z.string()),
});

// Wealth projection
const projectionSchema = z.object({
  year: z.number(),
  projected_value: z.number(),
});

// Main Financial Roadmap Result schema
export const financialRoadmapSchema = z.object({
  summary: z.object({
    totalIncome: z.number(),
    totalExpense: z.number(),
    netCashflow: z.number(),
    periodStart: z.string(),
    periodEnd: z.string(),
    currency: z.string().default("MNT"),
  }),
  monthlyBreakdown: z.array(monthlyDataSchema),
  rating: ratingSchema,
  milestones: milestonesSchema,
  strategy: strategySchema,
  projections: z.array(projectionSchema),
  bankName: z.string().nullable(),
});

export type FinancialRoadmapSchema = z.infer<typeof financialRoadmapSchema>;
