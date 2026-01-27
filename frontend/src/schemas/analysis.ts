import { z } from "zod";

// ============================================
// Financial Guide Report Zod Schemas
// ============================================

// --- Overview Section ---
const reportOverviewSchema = z.object({
  periodStart: z.string(),
  periodEnd: z.string(),
  totalMonths: z.number(),
  bankName: z.string().nullable(),
  currency: z.string().default("MNT"),
  generatedAt: z.string(),
});

// --- Financial Health Score (0-100) ---
const scoreFactorSchema = z.object({
  name: z.string(),
  impact: z.enum(["positive", "negative", "neutral"]),
  description: z.string(),
});

const financialScoreSchema = z.object({
  score: z.number().min(0).max(100),
  category: z.enum(["Сайн", "Анхаарах", "Эрсдэлтэй"]),
  categoryColor: z.enum(["green", "yellow", "red"]),
  description: z.string(),
  factors: z.array(scoreFactorSchema),
});

// --- Income Analysis ---
const incomeSourceSchema = z.object({
  name: z.string(),
  amount: z.number(),
  percentage: z.number(),
  frequency: z.enum(["Тогтмол", "Тогтмол бус"]),
});

const incomeAnalysisSchema = z.object({
  totalIncome: z.number(),
  monthlyAverage: z.number(),
  stability: z.enum(["Тогтвортой", "Тогтворгүй"]),
  stabilityScore: z.number().min(0).max(100),
  mainSources: z.array(incomeSourceSchema),
  insights: z.array(z.string()),
});

// --- Expense Analysis ---
const expenseCategorySchema = z.object({
  name: z.string(),
  amount: z.number(),
  percentage: z.number(),
  trend: z.enum(["Өсөж байна", "Буурч байна", "Тогтвортой"]),
});

const expenseAnalysisSchema = z.object({
  totalExpense: z.number(),
  monthlyAverage: z.number(),
  expenseToIncomeRatio: z.number(),
  topCategories: z.array(expenseCategorySchema),
  fixedExpenses: z.number(),
  variableExpenses: z.number(),
  insights: z.array(z.string()),
  warnings: z.array(z.string()),
});

// --- Cashflow Analysis ---
const monthlyCashflowSchema = z.object({
  month: z.string(),
  income: z.number(),
  expense: z.number(),
  netCashflow: z.number(),
});

const cashflowAnalysisSchema = z.object({
  netCashflow: z.number(),
  monthlyAverage: z.number(),
  trend: z.enum(["Эерэг", "Сөрөг", "Тогтвортой"]),
  monthlyBreakdown: z.array(monthlyCashflowSchema),
  deficitMonths: z.array(z.string()),
  surplusMonths: z.array(z.string()),
  savingsRate: z.number(),
  insights: z.array(z.string()),
});

// --- Behavior Patterns ---
const behaviorPatternSchema = z.object({
  type: z.enum([
    "salary_driven",
    "end_of_month_shortage",
    "frequent_small_expenses",
    "impulse_spending",
    "consistent_saving",
    "seasonal_variation",
  ]),
  detected: z.boolean(),
  severity: z.enum(["low", "medium", "high"]).nullable(),
  description: z
    .string()
    .nullable()
    .transform((val) => val ?? ""),
});

const behaviorPatternsSchema = z.object({
  patterns: z.array(behaviorPatternSchema),
  spendingProfile: z.enum(["Хэмнэлттэй", "Тэнцвэртэй", "Өгөөмөр"]),
  insights: z.array(z.string()),
});

// --- Risk Signals ---
const riskSignalSchema = z.object({
  type: z.enum([
    "expense_exceeds_income",
    "no_savings",
    "single_income_dependency",
    "increasing_debt",
    "high_expense_ratio",
    "irregular_income",
  ]),
  detected: z.boolean(),
  severity: z.enum(["Бага", "Дунд", "Өндөр"]),
  title: z.string(),
  description: z.string(),
  recommendation: z.string(),
});

const riskSignalsSchema = z.object({
  overallRiskLevel: z.enum(["Бага", "Дунд", "Өндөр"]),
  risks: z.array(riskSignalSchema),
  hasUrgentRisks: z.boolean(),
});

// --- Recommendations ---
const recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  impact: z.enum(["Өндөр", "Дунд", "Бага"]),
  difficulty: z.enum(["Хялбар", "Дунд", "Хэцүү"]),
  timeframe: z.enum(["Богино хугацаа", "Дунд хугацаа", "Урт хугацаа"]),
  actionItems: z.array(z.string()),
});

const recommendationsSchema = z.object({
  priority: z.array(recommendationSchema),
  savings: z.array(recommendationSchema),
  investment: z.array(recommendationSchema),
  lifestyle: z.array(recommendationSchema),
});

// --- Milestones (simplified format for compatibility) ---
const milestoneSchema = z.object({
  amount_mnt: z.number(),
  years_to_reach: z.number(),
});

const milestonesSchema = z.object({
  security: milestoneSchema,
  comfort: milestoneSchema,
  freedom: milestoneSchema,
  super_freedom: milestoneSchema,
});

// --- Projections ---
const projectionSchema = z.object({
  year: z.number(),
  projected_value: z.number(),
  assumptions: z.string(),
});

// --- Strategy ---
const allocationSuggestionSchema = z.object({
  category: z.string(),
  percentage: z.number(),
  description: z.string(),
});

const strategySchema = z.object({
  philosophy: z.string(),
  advice_items: z.array(z.string()),
  riskTolerance: z.enum(["Бага", "Дунд", "Өндөр"]),
  suggestedAllocation: z.array(allocationSuggestionSchema),
});

// --- Summary Verdict ---
const summaryVerdictSchema = z.object({
  overallStatus: z.string(),
  mainStrength: z.string(),
  mainRisk: z.string(),
  mainOpportunity: z.string(),
  nextSteps: z.array(z.string()),
});

// ============================================
// Main Financial Guide Report Schema
// ============================================
export const financialGuideReportSchema = z.object({
  overview: reportOverviewSchema,
  score: financialScoreSchema,
  income: incomeAnalysisSchema,
  expense: expenseAnalysisSchema,
  cashflow: cashflowAnalysisSchema,
  behaviorPatterns: behaviorPatternsSchema,
  risks: riskSignalsSchema,
  recommendations: recommendationsSchema,
  milestones: milestonesSchema,
  projections: z.array(projectionSchema),
  strategy: strategySchema,
  verdict: summaryVerdictSchema,
});

export type FinancialGuideReportSchema = z.infer<
  typeof financialGuideReportSchema
>;

// ============================================
// Legacy Schema (for backward compatibility)
// ============================================
const monthlyDataSchema = z.object({
  month: z.string(),
  income: z.number(),
  expense: z.number(),
});

const legacyRatingSchema = z.object({
  grade: z.enum(["AA", "A", "B", "C", "D", "E"]),
  status_mn: z.string(),
  description: z.string(),
});

const legacyMilestoneSchema = z.object({
  amount_mnt: z.number(),
  years_to_reach: z.number(),
});

const legacyMilestonesSchema = z.object({
  security: legacyMilestoneSchema,
  comfort: legacyMilestoneSchema,
  freedom: legacyMilestoneSchema,
  super_freedom: legacyMilestoneSchema,
});

const legacyStrategySchema = z.object({
  philosophy: z.string(),
  advice_items: z.array(z.string()),
});

const legacyProjectionSchema = z.object({
  year: z.number(),
  projected_value: z.number(),
});

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
  rating: legacyRatingSchema,
  milestones: legacyMilestonesSchema,
  strategy: legacyStrategySchema,
  projections: z.array(legacyProjectionSchema),
  bankName: z.string().nullable(),
});

export type FinancialRoadmapSchema = z.infer<typeof financialRoadmapSchema>;
