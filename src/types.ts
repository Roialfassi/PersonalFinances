export type IncomeFrequency =
  | "annual"
  | "monthly"
  | "twice-monthly"
  | "biweekly"
  | "weekly"
  | "hourly";

export type IncomeType = "take-home" | "gross";

export type CurrencyCode = "USD" | "ILS";

export type CategoryGroup =
  | "essentials"
  | "lifestyle"
  | "savings"
  | "debt"
  | "giving"
  | "miscellaneous";

export type WarningLevel = "none" | "low" | "high" | "over";

export interface BudgetCategory {
  id: string;
  name: string;
  group: CategoryGroup;
  percent: number;
  suggestedPercent?: number;
  minRecommendedPercent?: number;
  maxRecommendedPercent?: number;
  isEssential?: boolean;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  shortName: string;
  description: string;
  categories: BudgetCategory[];
}

export interface BudgetScenario {
  id: string;
  name: string;
  incomeAmount: number;
  incomeFrequency: IncomeFrequency;
  incomeType: IncomeType;
  grossTakeHomeRate: number;
  hoursPerWeek: number;
  currencyCode?: CurrencyCode;
  ilsPerUsd?: number;
  templateId: string;
  categories: BudgetCategory[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryOutput extends BudgetCategory {
  monthlyAmount: number;
  annualAmount: number;
  perPaycheckAmount: number;
  warningLevel: WarningLevel;
  warningMessage?: string;
}

export interface BudgetWarning {
  id: string;
  level: "info" | "warning" | "danger";
  message: string;
}

export interface BudgetOutput {
  monthlyIncome: number;
  annualIncome: number;
  perPaycheckIncome: number;
  paychecksPerYear: number;
  totalAssignedPercent: number;
  remainingPercent: number;
  totalAssignedMonthlyAmount: number;
  remainingMonthlyAmount: number;
  zeroBasedBalance: number;
  categories: CategoryOutput[];
  warnings: BudgetWarning[];
}
