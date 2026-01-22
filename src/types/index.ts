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

export interface AnalysisResult {
  summary: AnalysisSummary;
  monthlyBreakdown: MonthlySummary[];
  topIncomeCategories: Category[];
  topExpenseCategories: Category[];
  insights: string[];
  warnings?: string[];
  bankName: string | null;
}

export interface ActionState {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
}
