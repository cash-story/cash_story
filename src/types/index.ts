export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
}

export interface Category {
  name: string;
  amount: number;
  percentage: number;
}

export interface AnalysisSummary {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  periodStart: string;
  periodEnd: string;
  currency: string;
}

// Rating system based on Ganbat model
export interface Rating {
  grade: "AA" | "A" | "B" | "C" | "D" | "E";
  status_mn: string;
  description: string;
}

// Financial milestone
export interface Milestone {
  amount_mnt: number;
  years_to_reach: number;
}

// 4 Milestones to Financial Freedom
export interface Milestones {
  security: Milestone; // Санхүүгийн хамгаалалт - 6 months expenses
  comfort: Milestone; // Санхүүгийн тав тух - 50% passive income
  freedom: Milestone; // Санхүүгийн эрх чөлөө - 100% passive income
  super_freedom: Milestone; // Санхүүгийн супер эрх чөлөө - ₮1B+ target
}

// Investment Strategy - Мянгат малчин
export interface Strategy {
  philosophy: string;
  advice_items: string[];
}

// Wealth Projection
export interface Projection {
  year: number;
  projected_value: number;
}

// Main Financial Roadmap Result
export interface FinancialRoadmapResult {
  // Basic summary from bank statement
  summary: AnalysisSummary;
  monthlyBreakdown: MonthlySummary[];

  // Financial Freedom data
  rating: Rating;
  milestones: Milestones;
  strategy: Strategy;
  projections: Projection[];

  // Bank context
  bankName: string | null;
}

export interface ActionState {
  success: boolean;
  data?: FinancialRoadmapResult;
  error?: string;
}
