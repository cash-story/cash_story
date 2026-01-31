// ============================================
// Financial Guide Report Types
// Based on Notion Tasks Tracker requirements
// ============================================

// --- Overview Section ---
export interface ReportOverview {
  periodStart: string;
  periodEnd: string;
  totalMonths: number;
  bankName: string | null;
  currency: string;
  generatedAt: string;
}

// --- Financial Health Score (0-100) ---
export interface FinancialScore {
  score: number; // 0-100
  category: "Сайн" | "Анхаарах" | "Эрсдэлтэй";
  categoryColor: "green" | "yellow" | "red";
  description: string;
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  name: string;
  impact: "positive" | "negative" | "neutral";
  description: string;
}

// --- Income Analysis ---
export interface IncomeAnalysis {
  totalIncome: number;
  monthlyAverage: number;
  stability: "Тогтвортой" | "Тогтворгүй";
  stabilityScore: number; // 0-100, coefficient of variation based
  mainSources: IncomeSource[];
  insights: string[];
}

export interface IncomeSource {
  name: string;
  amount: number;
  percentage: number;
  frequency: "Тогтмол" | "Тогтмол бус";
}

// --- Expense Analysis ---
export interface ExpenseAnalysis {
  totalExpense: number;
  monthlyAverage: number;
  expenseToIncomeRatio: number; // percentage
  topCategories: ExpenseCategory[];
  fixedExpenses: number;
  variableExpenses: number;
  insights: string[];
  warnings: string[]; // overspending, sudden spikes
}

export interface ExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
  trend: "Өсөж байна" | "Буурч байна" | "Тогтвортой";
}

// --- Cashflow Analysis ---
export interface CashflowAnalysis {
  netCashflow: number;
  monthlyAverage: number;
  trend: "Эерэг" | "Сөрөг" | "Тогтвортой";
  monthlyBreakdown: MonthlyCashflow[];
  deficitMonths: string[]; // months with negative cashflow
  surplusMonths: string[]; // months with positive cashflow
  savingsRate: number; // percentage
  insights: string[];
}

export interface MonthlyCashflow {
  month: string;
  income: number;
  expense: number;
  netCashflow: number;
}

// --- Behavior Patterns Detection ---
export interface BehaviorPatterns {
  patterns: BehaviorPattern[];
  spendingProfile: "Хэмнэлттэй" | "Тэнцвэртэй" | "Өгөөмөр";
  insights: string[];
}

export interface BehaviorPattern {
  type:
    | "salary_driven"
    | "end_of_month_shortage"
    | "frequent_small_expenses"
    | "impulse_spending"
    | "consistent_saving"
    | "seasonal_variation";
  detected: boolean;
  severity: "low" | "medium" | "high" | null;
  description: string;
}

// --- Risk Signals Detection ---
export interface RiskSignals {
  overallRiskLevel: "Бага" | "Дунд" | "Өндөр";
  risks: RiskSignal[];
  hasUrgentRisks: boolean;
}

export interface RiskSignal {
  type:
    | "expense_exceeds_income"
    | "no_savings"
    | "single_income_dependency"
    | "increasing_debt"
    | "high_expense_ratio"
    | "irregular_income";
  detected: boolean;
  severity: "Бага" | "Дунд" | "Өндөр";
  title: string;
  description: string;
  recommendation: string;
}

// --- Recommendations Engine ---
export interface Recommendations {
  priority: Recommendation[];
  savings: Recommendation[];
  investment: Recommendation[];
  lifestyle: Recommendation[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: "Өндөр" | "Дунд" | "Бага";
  difficulty: "Хялбар" | "Дунд" | "Хэцүү";
  timeframe: "Богино хугацаа" | "Дунд хугацаа" | "Урт хугацаа";
  actionItems: string[];
}

// --- Financial Milestones (New format with full details) ---
export interface MilestoneDetail {
  name: string;
  amount_mnt: number;
  years_to_reach: number;
  currentProgress: number; // percentage
  description: string;
}

export interface MilestonesDetail {
  security: MilestoneDetail;
  comfort: MilestoneDetail;
  freedom: MilestoneDetail;
  super_freedom: MilestoneDetail;
}

// --- Legacy Milestone format (for backward compatibility) ---
export interface Milestone {
  amount_mnt: number;
  years_to_reach: number;
}

export interface Milestones {
  security: Milestone;
  comfort: Milestone;
  freedom: Milestone;
  super_freedom: Milestone;
}

// --- Wealth Projections ---
export interface Projection {
  year: number;
  projected_value: number;
  assumptions?: string;
}

// --- Summary Verdict ---
export interface SummaryVerdict {
  overallStatus: string;
  mainStrength: string;
  mainRisk: string;
  mainOpportunity: string;
  nextSteps: string[];
}

// --- Investment Strategy ---
export interface Strategy {
  philosophy: string;
  advice_items: string[];
  riskTolerance?: "Бага" | "Дунд" | "Өндөр";
  suggestedAllocation?: AllocationSuggestion[];
}

export interface AllocationSuggestion {
  category: string;
  percentage: number;
  description: string;
}

// ============================================
// Main Financial Guide Report
// ============================================
export interface FinancialGuideReport {
  // Section 1: Overview
  overview: ReportOverview;

  // Section 2: Financial Health Score
  score: FinancialScore;

  // Section 3: Income Analysis
  income: IncomeAnalysis;

  // Section 4: Expense Analysis
  expense: ExpenseAnalysis;

  // Section 5: Cashflow Analysis
  cashflow: CashflowAnalysis;

  // Section 6: Behavior Patterns
  behaviorPatterns: BehaviorPatterns;

  // Section 7: Risk Signals
  risks: RiskSignals;

  // Section 8: Recommendations
  recommendations: Recommendations;

  // Section 9: Financial Milestones (uses legacy format for compatibility)
  milestones: Milestones;

  // Section 10: Wealth Projections
  projections: Projection[];

  // Section 11: Investment Strategy
  strategy: Strategy;

  // Section 12: Summary Verdict
  verdict: SummaryVerdict;
}

// ============================================
// Legacy types (for backward compatibility)
// ============================================
export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
}

export interface LegacyCategory {
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

export interface Rating {
  grade: "AA" | "A" | "B" | "C" | "D" | "E";
  status_mn: string;
  description: string;
}

export interface FinancialRoadmapResult {
  summary: AnalysisSummary;
  monthlyBreakdown: MonthlySummary[];
  rating: Rating;
  milestones: Milestones;
  strategy: Strategy;
  projections: Projection[];
  bankName: string | null;
}

// ============================================
// Action State
// ============================================
export interface ActionState {
  success: boolean;
  data?: FinancialGuideReport;
  error?: string;
}

// ============================================
// Transaction Categorization Types
// ============================================
export interface Category {
  id: string;
  name: string;
  name_en?: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface CategoryList {
  income: Category[];
  expense: Category[];
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  suggested_category_id?: string;
  suggested_category_name?: string;
}

export interface Transaction {
  id: string;
  statement_id?: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category_id?: string;
  category_name?: string;
  is_categorized: boolean;
  ai_suggested_category_id?: string;
  ai_suggested_category_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  categorized_count: number;
  uncategorized_count: number;
}
