import type { BudgetOutput, BudgetScenario } from "../types";

const escapeCsv = (value: string | number) => {
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }

  return text;
};

export const scenarioToCsv = (scenario: BudgetScenario, output: BudgetOutput): string => {
  const rows = [
    ["Scenario", scenario.name],
    ["Monthly income", output.monthlyIncome],
    ["Annual income", output.annualIncome],
    ["Total assigned percent", output.totalAssignedPercent],
    ["Remaining monthly amount", output.remainingMonthlyAmount],
    [],
    ["Category", "Group", "Percent", "Monthly", "Per paycheck", "Annual"],
    ...output.categories.map((category) => [
      category.name,
      category.group,
      category.percent,
      category.monthlyAmount,
      category.perPaycheckAmount,
      category.annualAmount
    ])
  ];

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
};

export const downloadTextFile = (filename: string, contents: string, type: string) => {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
