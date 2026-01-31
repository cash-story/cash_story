"use client";

import { useState } from "react";
import type { FinancialGuideReport } from "@/types";
import { Button } from "@/components/ui/button";
import {
  OverviewDashboard,
  IncomeDetailSection,
  ExpenseDetailSection,
  CashflowDetailSection,
  BudgetComparisonSection,
} from "@/components/income-outcome";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  ArrowDownUp,
  Calculator,
} from "lucide-react";

interface IncomeOutcomeAnalysisProps {
  report: FinancialGuideReport;
}

type SectionType = "overview" | "income" | "expense" | "cashflow" | "budget";

const sections: {
  id: SectionType;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "overview",
    label: "Ерөнхий",
    shortLabel: "Ерөнхий",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: "income",
    label: "Орлого",
    shortLabel: "Орлого",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    id: "expense",
    label: "Зарлага",
    shortLabel: "Зарлага",
    icon: <TrendingDown className="w-4 h-4" />,
  },
  {
    id: "cashflow",
    label: "Мөнгөн урсгал",
    shortLabel: "Урсгал",
    icon: <ArrowDownUp className="w-4 h-4" />,
  },
  {
    id: "budget",
    label: "Төсөв",
    shortLabel: "Төсөв",
    icon: <Calculator className="w-4 h-4" />,
  },
];

export function IncomeOutcomeAnalysis({ report }: IncomeOutcomeAnalysisProps) {
  const [activeSection, setActiveSection] = useState<SectionType>("overview");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Desktop/Tablet Sub-navigation */}
      <div className="hidden sm:flex gap-2 flex-wrap border-b pb-4">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection(section.id)}
            className="gap-2"
          >
            {section.icon}
            {section.label}
          </Button>
        ))}
      </div>

      {/* Mobile Horizontal Scroll Navigation */}
      <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 min-w-max pb-3 border-b">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection(section.id)}
              className="gap-1.5 text-xs px-3 py-2 h-auto whitespace-nowrap"
            >
              {section.icon}
              {section.shortLabel}
            </Button>
          ))}
        </div>
      </div>

      {/* Section content */}
      {activeSection === "overview" && <OverviewDashboard report={report} />}
      {activeSection === "income" && (
        <IncomeDetailSection
          income={report.income}
          overview={report.overview}
        />
      )}
      {activeSection === "expense" && (
        <ExpenseDetailSection
          expense={report.expense}
          overview={report.overview}
        />
      )}
      {activeSection === "cashflow" && (
        <CashflowDetailSection
          cashflow={report.cashflow}
          overview={report.overview}
        />
      )}
      {activeSection === "budget" && (
        <BudgetComparisonSection report={report} />
      )}
    </div>
  );
}
