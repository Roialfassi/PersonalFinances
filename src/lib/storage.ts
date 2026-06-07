import type { BudgetScenario } from "../types";

const SCENARIOS_KEY = "salary-budget-splitter:scenarios";
const ACTIVE_SCENARIO_KEY = "salary-budget-splitter:active-scenario";
const ZERO_BASED_KEY = "salary-budget-splitter:zero-based";

export const loadScenarios = (): BudgetScenario[] => {
  try {
    const rawValue = localStorage.getItem(SCENARIOS_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveScenarios = (scenarios: BudgetScenario[]) => {
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
};

export const loadActiveScenarioId = (): string | null => localStorage.getItem(ACTIVE_SCENARIO_KEY);

export const saveActiveScenarioId = (id: string) => {
  localStorage.setItem(ACTIVE_SCENARIO_KEY, id);
};

export const loadZeroBasedMode = (): boolean => localStorage.getItem(ZERO_BASED_KEY) !== "false";

export const saveZeroBasedMode = (enabled: boolean) => {
  localStorage.setItem(ZERO_BASED_KEY, String(enabled));
};
