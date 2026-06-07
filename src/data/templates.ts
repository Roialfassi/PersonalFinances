import type { BudgetCategory, BudgetTemplate, CategoryGroup } from "../types";

const category = (
  name: string,
  group: CategoryGroup,
  percent: number,
  options: Partial<BudgetCategory> = {}
): BudgetCategory => ({
  id: crypto.randomUUID(),
  name,
  group,
  percent,
  ...options
});

export const createCategory = (
  name: string,
  group: CategoryGroup,
  percent: number
): BudgetCategory =>
  category(name, group, percent, {
    minRecommendedPercent: group === "savings" ? 10 : undefined,
    maxRecommendedPercent: group === "essentials" ? 30 : undefined
  });

const essentials = {
  housing: { maxRecommendedPercent: 25, isEssential: true },
  food: { maxRecommendedPercent: 15, isEssential: true },
  transportation: { maxRecommendedPercent: 12, isEssential: true },
  core: { maxRecommendedPercent: 55, isEssential: true }
};

export const budgetTemplates: BudgetTemplate[] = [
  {
    id: "simple-50-30-20",
    name: "Simple 50/30/20",
    shortName: "50/30/20",
    description: "A simple split for needs, lifestyle, savings, and debt.",
    categories: [
      category("Housing", "essentials", 25, essentials.housing),
      category("Food", "essentials", 12, essentials.food),
      category("Transportation", "essentials", 8, essentials.transportation),
      category("Other needs", "essentials", 5, essentials.core),
      category("Lifestyle", "lifestyle", 30, { maxRecommendedPercent: 30 }),
      category("Savings", "savings", 15, { minRecommendedPercent: 10 }),
      category("Debt", "debt", 5)
    ]
  },
  {
    id: "ramsey-inspired",
    name: "Ramsey-Inspired Categories",
    shortName: "Category",
    description: "A zero-based starter with giving, saving, needs, and flexible spending.",
    categories: [
      category("Giving", "giving", 10),
      category("Savings", "savings", 10, { minRecommendedPercent: 10 }),
      category("Housing", "essentials", 25, essentials.housing),
      category("Food", "essentials", 10, essentials.food),
      category("Transportation", "essentials", 10, essentials.transportation),
      category("Debt", "debt", 10),
      category("Lifestyle", "lifestyle", 20, { maxRecommendedPercent: 25 }),
      category("Miscellaneous", "miscellaneous", 5, { maxRecommendedPercent: 10 })
    ]
  },
  {
    id: "aggressive-savings",
    name: "Aggressive Savings",
    shortName: "Savings",
    description: "A leaner lifestyle split that pushes more income toward savings.",
    categories: [
      category("Housing", "essentials", 22, essentials.housing),
      category("Food", "essentials", 10, essentials.food),
      category("Transportation", "essentials", 7, essentials.transportation),
      category("Other needs", "essentials", 8, essentials.core),
      category("Savings", "savings", 35, { minRecommendedPercent: 10 }),
      category("Giving", "giving", 5),
      category("Lifestyle", "lifestyle", 10, { maxRecommendedPercent: 15 }),
      category("Miscellaneous", "miscellaneous", 3, { maxRecommendedPercent: 8 })
    ]
  },
  {
    id: "debt-heavy",
    name: "Debt Heavy",
    shortName: "Debt",
    description: "Keeps essentials covered while assigning more to debt payoff.",
    categories: [
      category("Housing", "essentials", 25, essentials.housing),
      category("Food", "essentials", 10, essentials.food),
      category("Transportation", "essentials", 8, essentials.transportation),
      category("Other needs", "essentials", 7, essentials.core),
      category("Debt", "debt", 25),
      category("Savings", "savings", 5, { minRecommendedPercent: 5 }),
      category("Giving", "giving", 5),
      category("Lifestyle", "lifestyle", 10, { maxRecommendedPercent: 15 }),
      category("Miscellaneous", "miscellaneous", 5, { maxRecommendedPercent: 10 })
    ]
  },
  {
    id: "custom-blank",
    name: "Custom Starter",
    shortName: "Custom",
    description: "Broad buckets for a quick split that can be renamed.",
    categories: [
      category("Essentials", "essentials", 50, { maxRecommendedPercent: 60 }),
      category("Savings", "savings", 20, { minRecommendedPercent: 10 }),
      category("Debt", "debt", 10),
      category("Lifestyle", "lifestyle", 15, { maxRecommendedPercent: 30 }),
      category("Miscellaneous", "miscellaneous", 5, { maxRecommendedPercent: 10 })
    ]
  }
];

export const cloneTemplateCategories = (templateId: string): BudgetCategory[] => {
  const template = budgetTemplates.find((item) => item.id === templateId) ?? budgetTemplates[0];

  return template.categories.map((item) => ({
    ...item,
    id: crypto.randomUUID()
  }));
};
