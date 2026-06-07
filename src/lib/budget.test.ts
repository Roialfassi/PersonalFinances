import { describe, expect, it } from "vitest";
import { cloneTemplateCategories } from "../data/templates";
import type { BudgetScenario } from "../types";
import { calculateBudget, normalizeIncomeToMonthly, sumPercent } from "./budget";
import { scenarioToCsv } from "./exporters";

const scenario = (overrides: Partial<BudgetScenario> = {}): BudgetScenario => ({
  id: "scenario-1",
  name: "Test budget",
  incomeAmount: 6000,
  incomeFrequency: "monthly",
  incomeType: "take-home",
  grossTakeHomeRate: 0.75,
  hoursPerWeek: 40,
  templateId: "simple-50-30-20",
  categories: cloneTemplateCategories("simple-50-30-20"),
  notes: "",
  createdAt: "2026-06-06T00:00:00.000Z",
  updatedAt: "2026-06-06T00:00:00.000Z",
  ...overrides
});

describe("budget calculations", () => {
  it("normalizes annual income to monthly income", () => {
    expect(normalizeIncomeToMonthly(120000, "annual", "take-home", 0.75, 40)).toBe(10000);
  });

  it("normalizes biweekly income to monthly income", () => {
    expect(normalizeIncomeToMonthly(2000, "biweekly", "take-home", 0.75, 40)).toBeCloseTo(
      4333.33,
      2
    );
  });

  it("normalizes hourly gross income with a take-home rate", () => {
    expect(normalizeIncomeToMonthly(25, "hourly", "gross", 0.8, 40)).toBeCloseTo(3466.67, 2);
  });

  it("calculates category amounts and remaining income", () => {
    const output = calculateBudget(scenario(), true);
    const housing = output.categories.find((category) => category.name === "Housing");

    expect(output.monthlyIncome).toBe(6000);
    expect(output.totalAssignedPercent).toBe(100);
    expect(output.remainingMonthlyAmount).toBe(0);
    expect(housing?.monthlyAmount).toBe(1500);
  });

  it("detects under-assigned zero-based budgets", () => {
    const categories = cloneTemplateCategories("custom-blank").map((category) =>
      category.name === "Miscellaneous" ? { ...category, percent: 0 } : category
    );
    const output = calculateBudget(scenario({ categories }), true);

    expect(sumPercent(categories)).toBe(95);
    expect(output.warnings.some((warning) => warning.id === "under-assigned")).toBe(true);
  });

  it("exports a scenario as CSV", () => {
    const testScenario = scenario();
    const csv = scenarioToCsv(testScenario, calculateBudget(testScenario, true));

    expect(csv).toContain("Category,Group,Percent,Monthly,Per paycheck,Annual");
    expect(csv).toContain("Housing,essentials,25,1500");
  });
});
