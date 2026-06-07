import type {
  BudgetCategory,
  BudgetOutput,
  BudgetScenario,
  BudgetWarning,
  IncomeFrequency,
  WarningLevel
} from "../types";

export const paychecksPerYearByFrequency: Record<IncomeFrequency, number> = {
  annual: 12,
  monthly: 12,
  "twice-monthly": 24,
  biweekly: 26,
  weekly: 52,
  hourly: 52
};

export const normalizeIncomeToMonthly = (
  amount: number,
  frequency: IncomeFrequency,
  incomeType: "take-home" | "gross",
  grossTakeHomeRate: number,
  hoursPerWeek: number
): number => {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const safeHours = Number.isFinite(hoursPerWeek) ? Math.max(0, hoursPerWeek) : 0;
  const safeRate = Number.isFinite(grossTakeHomeRate)
    ? Math.min(Math.max(grossTakeHomeRate, 0), 1)
    : 1;

  const monthlyGrossOrNet = (() => {
    switch (frequency) {
      case "annual":
        return safeAmount / 12;
      case "monthly":
        return safeAmount;
      case "twice-monthly":
        return safeAmount * 2;
      case "biweekly":
        return (safeAmount * 26) / 12;
      case "weekly":
        return (safeAmount * 52) / 12;
      case "hourly":
        return (safeAmount * safeHours * 52) / 12;
      default:
        return safeAmount;
    }
  })();

  return incomeType === "gross" ? monthlyGrossOrNet * safeRate : monthlyGrossOrNet;
};

export const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

export const sumPercent = (categories: BudgetCategory[]): number =>
  roundCurrency(categories.reduce((total, category) => total + Number(category.percent || 0), 0));

export const calculateBudget = (scenario: BudgetScenario, zeroBasedMode: boolean): BudgetOutput => {
  const monthlyIncome = normalizeIncomeToMonthly(
    scenario.incomeAmount,
    scenario.incomeFrequency,
    scenario.incomeType,
    scenario.grossTakeHomeRate,
    scenario.hoursPerWeek
  );
  const annualIncome = monthlyIncome * 12;
  const paychecksPerYear = paychecksPerYearByFrequency[scenario.incomeFrequency];
  const perPaycheckIncome = annualIncome / paychecksPerYear;
  const totalAssignedPercent = sumPercent(scenario.categories);
  const remainingPercent = roundCurrency(100 - totalAssignedPercent);
  const totalAssignedMonthlyAmount = monthlyIncome * (totalAssignedPercent / 100);
  const remainingMonthlyAmount = monthlyIncome - totalAssignedMonthlyAmount;

  const categories = scenario.categories.map((category) => {
    const monthlyAmount = monthlyIncome * (category.percent / 100);
    const annualAmount = monthlyAmount * 12;
    const perPaycheckAmount = annualAmount / paychecksPerYear;
    const warningLevel = getCategoryWarningLevel(category);

    return {
      ...category,
      monthlyAmount: roundCurrency(monthlyAmount),
      annualAmount: roundCurrency(annualAmount),
      perPaycheckAmount: roundCurrency(perPaycheckAmount),
      warningLevel,
      warningMessage: getCategoryWarningMessage(category, warningLevel)
    };
  });

  const warnings = getBudgetWarnings({
    monthlyIncome,
    totalAssignedPercent,
    remainingPercent,
    categories: scenario.categories,
    zeroBasedMode
  });

  return {
    monthlyIncome: roundCurrency(monthlyIncome),
    annualIncome: roundCurrency(annualIncome),
    perPaycheckIncome: roundCurrency(perPaycheckIncome),
    paychecksPerYear,
    totalAssignedPercent,
    remainingPercent,
    totalAssignedMonthlyAmount: roundCurrency(totalAssignedMonthlyAmount),
    remainingMonthlyAmount: roundCurrency(remainingMonthlyAmount),
    zeroBasedBalance: roundCurrency(remainingMonthlyAmount),
    categories,
    warnings
  };
};

const getCategoryWarningLevel = (category: BudgetCategory): WarningLevel => {
  if (
    category.maxRecommendedPercent !== undefined &&
    category.percent > category.maxRecommendedPercent
  ) {
    return "high";
  }

  if (
    category.minRecommendedPercent !== undefined &&
    category.percent < category.minRecommendedPercent
  ) {
    return "low";
  }

  return "none";
};

const getCategoryWarningMessage = (
  category: BudgetCategory,
  warningLevel: "none" | "low" | "high" | "over"
): string | undefined => {
  if (warningLevel === "high") {
    return `${category.name} is higher than the suggested ${category.maxRecommendedPercent}% guide.`;
  }

  if (warningLevel === "low") {
    return `${category.name} is lower than the suggested ${category.minRecommendedPercent}% guide.`;
  }

  return undefined;
};

const getBudgetWarnings = ({
  monthlyIncome,
  totalAssignedPercent,
  remainingPercent,
  categories,
  zeroBasedMode
}: {
  monthlyIncome: number;
  totalAssignedPercent: number;
  remainingPercent: number;
  categories: BudgetCategory[];
  zeroBasedMode: boolean;
}): BudgetWarning[] => {
  const warnings: BudgetWarning[] = [];

  if (monthlyIncome <= 0) {
    warnings.push({
      id: "missing-income",
      level: "info",
      message: "Enter income to calculate category amounts."
    });
  }

  if (totalAssignedPercent > 100) {
    warnings.push({
      id: "over-assigned",
      level: "danger",
      message: `This plan is ${roundCurrency(totalAssignedPercent - 100)}% over your income.`
    });
  }

  if (zeroBasedMode && totalAssignedPercent < 100) {
    warnings.push({
      id: "under-assigned",
      level: "warning",
      message: `You still have ${Math.abs(remainingPercent)}% of your income left to place.`
    });
  }

  const savingsTotal = categories
    .filter((category) => category.group === "savings")
    .reduce((total, category) => total + category.percent, 0);

  if (monthlyIncome > 0 && savingsTotal < 10) {
    warnings.push({
      id: "low-savings",
      level: "warning",
      message: "Savings is under 10%. Consider putting leftover money there first."
    });
  }

  const housing = categories.find((category) => category.name.toLowerCase().includes("housing"));

  if (housing && housing.percent > 25) {
    warnings.push({
      id: "high-housing",
      level: "warning",
      message: "Housing is above 25% of take-home income."
    });
  }

  return warnings;
};

export const getGroupTotals = (output: BudgetOutput) =>
  output.categories.reduce<Record<string, number>>((totals, category) => {
    totals[category.group] = roundCurrency((totals[category.group] ?? 0) + category.percent);
    return totals;
  }, {});

export const createScenarioName = () => {
  const date = new Date();
  return `Budget ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  })}`;
};
