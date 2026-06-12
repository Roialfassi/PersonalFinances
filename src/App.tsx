import {
  Calculator,
  ChevronDown,
  Copy,
  Download,
  FileDown,
  PiggyBank,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  WalletCards
} from "lucide-react";
import { type ChangeEvent, type ReactNode, useMemo, useRef, useState } from "react";
import { budgetTemplates, cloneTemplateCategories, createCategory } from "./data/templates";
import { calculateBudget, createScenarioName, getGroupTotals, roundCurrency } from "./lib/budget";
import { downloadTextFile, scenarioToCsv } from "./lib/exporters";
import {
  loadActiveScenarioId,
  loadScenarios,
  loadZeroBasedMode,
  saveActiveScenarioId,
  saveScenarios,
  saveZeroBasedMode
} from "./lib/storage";
import type {
  BudgetCategory,
  BudgetScenario,
  CategoryGroup,
  CategoryOutput,
  CurrencyCode,
  IncomeFrequency
} from "./types";

type BudgetStepId = "pay" | "plan" | "savings" | "expenses" | "finish";

const DEFAULT_ILS_PER_USD = 3.7;

const groupLabels: Record<CategoryGroup, string> = {
  essentials: "Essentials",
  lifestyle: "Lifestyle",
  savings: "Savings",
  debt: "Debt",
  giving: "Giving",
  miscellaneous: "Misc"
};

const categoryFlowOrder: CategoryGroup[] = [
  "savings",
  "essentials",
  "debt",
  "lifestyle",
  "giving",
  "miscellaneous"
];

const expenseGroupOrder: CategoryGroup[] = [
  "essentials",
  "debt",
  "lifestyle",
  "giving",
  "miscellaneous"
];

const frequencyLabels: Record<IncomeFrequency, string> = {
  annual: "Annual",
  monthly: "Monthly",
  "twice-monthly": "Twice monthly",
  biweekly: "Biweekly",
  weekly: "Weekly",
  hourly: "Hourly"
};

const currencyLabels: Record<CurrencyCode, string> = {
  USD: "Dollars",
  ILS: "Shekels"
};

const currencyFormatters: Record<CurrencyCode, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }),
  ILS: new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  })
};

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1
});

const quickMonthlyIncomesByCurrency: Record<CurrencyCode, number[]> = {
  USD: [3000, 5000, 7500],
  ILS: [10000, 18000, 25000]
};

const createSuggestedTemplateCategories = (templateId: string): BudgetCategory[] =>
  cloneTemplateCategories(templateId).map((category) => ({
    ...category,
    suggestedPercent: category.percent,
    percent: 0
  }));

const createScenario = (templateId = "ramsey-inspired"): BudgetScenario => {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: createScenarioName(),
    incomeAmount: 5000,
    incomeFrequency: "monthly",
    incomeType: "take-home",
    grossTakeHomeRate: 0.75,
    hoursPerWeek: 40,
    currencyCode: "USD",
    ilsPerUsd: DEFAULT_ILS_PER_USD,
    hasDebt: true,
    templateId,
    categories: createSuggestedTemplateCategories(templateId),
    notes: "",
    createdAt: now,
    updatedAt: now
  };
};

const getInitialState = () => {
  const scenarios = loadScenarios();
  const activeId = loadActiveScenarioId();
  const activeScenario = scenarios.find((item) => item.id === activeId) ?? scenarios[0];

  return {
    scenarios,
    scenario: activeScenario ?? createScenario()
  };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const formatPercent = (value: number) => `${percentFormatter.format(value || 0)}%`;

const getGroupRank = (group: CategoryGroup) => {
  const index = categoryFlowOrder.indexOf(group);
  return index === -1 ? categoryFlowOrder.length : index;
};

type StepSectionProps = {
  id: BudgetStepId;
  number: number;
  title: string;
  summary: string;
  activeStep: BudgetStepId;
  onStepChange: (id: BudgetStepId) => void;
  children: ReactNode;
};

function StepSection({
  id,
  number,
  title,
  summary,
  activeStep,
  onStepChange,
  children
}: StepSectionProps) {
  const isOpen = activeStep === id;
  const labelId = `${id}-step-title`;
  const bodyId = `${id}-step-body`;

  return (
    <section className={`step-panel ${isOpen ? "open" : ""}`} aria-labelledby={labelId}>
      <button
        className="step-trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={() => onStepChange(id)}
      >
        <span className="step-number">{number}</span>
        <span className="step-heading">
          <span id={labelId}>{title}</span>
          <small>{summary}</small>
        </span>
        <ChevronDown className="step-chevron" size={18} aria-hidden="true" />
      </button>
      <div className="step-body" id={bodyId} aria-hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
}

function App() {
  const initialState = useMemo(getInitialState, []);
  const [scenario, setScenario] = useState<BudgetScenario>(initialState.scenario);
  const [scenarios, setScenarios] = useState<BudgetScenario[]>(initialState.scenarios);
  const [zeroBasedMode, setZeroBasedMode] = useState(loadZeroBasedMode);
  const [activeStep, setActiveStep] = useState<BudgetStepId>("pay");
  const [activeExpenseGroup, setActiveExpenseGroup] = useState<CategoryGroup>("essentials");
  const [newCategory, setNewCategory] = useState<{
    name: string;
    group: CategoryGroup;
    percent: number;
  }>({
    name: "",
    group: "miscellaneous",
    percent: 0
  });
  const importInputRef = useRef<HTMLInputElement>(null);

  const output = useMemo(() => calculateBudget(scenario, zeroBasedMode), [scenario, zeroBasedMode]);
  const groupTotals = useMemo(() => getGroupTotals(output), [output]);
  const isSaved = scenarios.some((item) => item.id === scenario.id);
  const selectedTemplate = budgetTemplates.find((template) => template.id === scenario.templateId);
  const primaryCurrency: CurrencyCode = scenario.currencyCode === "ILS" ? "ILS" : "USD";
  const secondaryCurrency: CurrencyCode = primaryCurrency === "USD" ? "ILS" : "USD";
  const ilsPerUsd =
    Number.isFinite(scenario.ilsPerUsd) && Number(scenario.ilsPerUsd) > 0
      ? Number(scenario.ilsPerUsd)
      : DEFAULT_ILS_PER_USD;
  const quickMonthlyIncomes = quickMonthlyIncomesByCurrency[primaryCurrency];

  const formatMoney = (value: number, currencyCode: CurrencyCode = primaryCurrency) =>
    currencyFormatters[currencyCode].format(value || 0);
  const convertToSecondaryCurrency = (value: number) =>
    primaryCurrency === "USD" ? value * ilsPerUsd : value / ilsPerUsd;
  const formatCurrency = (value: number) => formatMoney(value, primaryCurrency);
  const formatSecondaryCurrency = (value: number) =>
    formatMoney(convertToSecondaryCurrency(value), secondaryCurrency);
  const renderMoneyPair = (value: number) => (
    <span className="money-pair">
      <strong>{formatCurrency(value)}</strong>
      <small>
        {secondaryCurrency}: {formatSecondaryCurrency(value)}
      </small>
    </span>
  );

  const hasDebt = scenario.hasDebt ?? true;
  const visibleExpenseGroups = expenseGroupOrder.filter((group) => group !== "debt" || hasDebt);
  const currentExpenseGroup =
    !hasDebt && activeExpenseGroup === "debt" ? "essentials" : activeExpenseGroup;

  const orderedCategories = useMemo(
    () =>
      [...output.categories].sort(
        (first, second) => getGroupRank(first.group) - getGroupRank(second.group)
      ),
    [output.categories]
  );
  const savingsCategories = orderedCategories.filter((category) => category.group === "savings");
  const expenseCategories = orderedCategories.filter(
    (category) => category.group !== "savings" && (hasDebt || category.group !== "debt")
  );
  const activeExpenseCategories = expenseCategories.filter(
    (category) => category.group === currentExpenseGroup
  );
  const suggestedSavingsPercent = roundCurrency(
    savingsCategories.reduce((total, category) => total + (category.suggestedPercent ?? 0), 0)
  );
  const suggestedExpensePercent = roundCurrency(
    expenseCategories.reduce((total, category) => total + (category.suggestedPercent ?? 0), 0)
  );
  const activeExpenseSuggestedPercent = roundCurrency(
    activeExpenseCategories.reduce((total, category) => total + (category.suggestedPercent ?? 0), 0)
  );
  const savingsMonthlyAmount = roundCurrency(
    savingsCategories.reduce((total, category) => total + category.monthlyAmount, 0)
  );
  const savingsPercent = roundCurrency(groupTotals.savings ?? 0);
  const expensesMonthlyAmount = roundCurrency(
    expenseCategories.reduce((total, category) => total + category.monthlyAmount, 0)
  );
  const expensesPercent = roundCurrency(output.totalAssignedPercent - savingsPercent);
  const activeExpenseGroupMonthlyAmount = roundCurrency(
    activeExpenseCategories.reduce((total, category) => total + category.monthlyAmount, 0)
  );
  const suggestedSavingsMonthlyAmount = roundCurrency(
    output.monthlyIncome * (suggestedSavingsPercent / 100)
  );
  const activeExpenseSuggestedMonthlyAmount = roundCurrency(
    output.monthlyIncome * (activeExpenseSuggestedPercent / 100)
  );
  const housingCategory = output.categories.find((category) =>
    category.name.toLowerCase().includes("housing")
  );
  const foodCategory = output.categories.find((category) =>
    category.name.toLowerCase().includes("food")
  );

  const touchScenario = (nextScenario: BudgetScenario) => ({
    ...nextScenario,
    updatedAt: new Date().toISOString()
  });

  const updateScenario = (updates: Partial<BudgetScenario>) => {
    setScenario((current) => touchScenario({ ...current, ...updates }));
  };

  const changePrimaryCurrency = (currencyCode: CurrencyCode) => {
    if (currencyCode === primaryCurrency) {
      return;
    }

    const nextIncomeAmount =
      primaryCurrency === "USD"
        ? scenario.incomeAmount * ilsPerUsd
        : scenario.incomeAmount / ilsPerUsd;

    updateScenario({
      currencyCode,
      incomeAmount: roundCurrency(nextIncomeAmount)
    });
  };

  const updateCategory = (categoryId: string, updates: Partial<BudgetCategory>) => {
    setScenario((current) =>
      touchScenario({
        ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId ? { ...category, ...updates } : category
        )
      })
    );
  };

  const applyCategorySuggestion = (categoryId: string) => {
    const category = scenario.categories.find((item) => item.id === categoryId);
    if (category?.suggestedPercent === undefined) {
      return;
    }

    updateCategory(categoryId, { percent: category.suggestedPercent });
  };

  const applyGroupSuggestions = (group: CategoryGroup) => {
    setScenario((current) =>
      touchScenario({
        ...current,
        categories: current.categories.map((category) =>
          category.group === group && category.suggestedPercent !== undefined
            ? { ...category, percent: category.suggestedPercent }
            : category
        )
      })
    );
  };

  const applyAllSuggestions = () => {
    setScenario((current) =>
      touchScenario({
        ...current,
        categories: current.categories.map((category) =>
          category.suggestedPercent !== undefined
            ? { ...category, percent: category.suggestedPercent }
            : category
        )
      })
    );
  };

  const adjustCategoryPercent = (categoryId: string, delta: number) => {
    const category = scenario.categories.find((item) => item.id === categoryId);
    if (!category) {
      return;
    }

    updateCategory(categoryId, {
      percent: roundCurrency(Math.max(0, category.percent + delta))
    });
  };

  const updateCategoryMonthlyAmount = (categoryId: string, monthlyAmount: number) => {
    if (output.monthlyIncome <= 0) {
      updateCategory(categoryId, { percent: 0 });
      return;
    }

    updateCategory(categoryId, {
      percent: roundCurrency(Math.max(0, (monthlyAmount / output.monthlyIncome) * 100))
    });
  };

  const addSavingsCategory = () => {
    setScenario((current) =>
      touchScenario({
        ...current,
        categories: [
          ...current.categories,
          {
            ...createCategory("Savings", "savings", 0),
            suggestedPercent: 10
          }
        ]
      })
    );
  };

  const addExpenseCategoryForActiveGroup = () => {
    setScenario((current) =>
      touchScenario({
        ...current,
        categories: [
          ...current.categories,
          createCategory(groupLabels[currentExpenseGroup], currentExpenseGroup, 0)
        ]
      })
    );
  };

  const updateHasDebt = (nextHasDebt: boolean) => {
    setScenario((current) =>
      touchScenario({
        ...current,
        hasDebt: nextHasDebt,
        categories: nextHasDebt
          ? current.categories
          : current.categories.map((category) =>
              category.group === "debt" ? { ...category, percent: 0 } : category
            )
      })
    );

    if (!nextHasDebt && activeExpenseGroup === "debt") {
      setActiveExpenseGroup("essentials");
    }
  };

  const addRemainingToSavings = () => {
    if (output.remainingPercent <= 0) {
      return;
    }

    const savings = scenario.categories.find((category) => category.group === "savings");
    if (savings) {
      updateCategory(savings.id, { percent: roundCurrency(savings.percent + output.remainingPercent) });
      return;
    }

    setScenario((current) =>
      touchScenario({
        ...current,
        categories: [
          ...current.categories,
          createCategory("Savings", "savings", output.remainingPercent)
        ]
      })
    );
  };

  const spreadRemaining = () => {
    if (output.remainingPercent <= 0 || scenario.categories.length === 0) {
      return;
    }

    const each = output.remainingPercent / scenario.categories.length;
    setScenario((current) =>
      touchScenario({
        ...current,
        categories: current.categories.map((category) => ({
          ...category,
          percent: roundCurrency(category.percent + each)
        }))
      })
    );
  };

  const reduceFlexibleSpending = () => {
    if (output.remainingPercent >= 0) {
      return;
    }

    let amountToReduce = Math.abs(output.remainingPercent);
    const flexibleGroups: CategoryGroup[] = ["lifestyle", "miscellaneous", "giving", "debt"];

    setScenario((current) =>
      touchScenario({
        ...current,
        categories: current.categories.map((category) => {
          if (amountToReduce <= 0 || !flexibleGroups.includes(category.group)) {
            return category;
          }

          const reduction = Math.min(category.percent, amountToReduce);
          amountToReduce = roundCurrency(amountToReduce - reduction);

          return {
            ...category,
            percent: roundCurrency(category.percent - reduction)
          };
        })
      })
    );
  };

  const fixBudget = () => {
    if (output.remainingPercent > 0) {
      addRemainingToSavings();
      return;
    }

    reduceFlexibleSpending();
  };

  const removeCategory = (categoryId: string) => {
    setScenario((current) =>
      touchScenario({
        ...current,
        categories: current.categories.filter((category) => category.id !== categoryId)
      })
    );
  };

  const applyTemplate = (templateId: string) => {
    updateScenario({
      templateId,
      categories: createSuggestedTemplateCategories(templateId)
    });
  };

  const saveCurrentScenario = (nextScenario = scenario) => {
    const scenarioToSave = touchScenario(nextScenario);
    const nextScenarios = scenarios.some((item) => item.id === scenarioToSave.id)
      ? scenarios.map((item) => (item.id === scenarioToSave.id ? scenarioToSave : item))
      : [scenarioToSave, ...scenarios];

    setScenario(scenarioToSave);
    setScenarios(nextScenarios);
    saveScenarios(nextScenarios);
    saveActiveScenarioId(scenarioToSave.id);
  };

  const duplicateScenario = () => {
    const now = new Date().toISOString();
    const duplicate = {
      ...scenario,
      id: crypto.randomUUID(),
      name: `${scenario.name} copy`,
      categories: scenario.categories.map((category) => ({
        ...category,
        id: crypto.randomUUID()
      })),
      createdAt: now,
      updatedAt: now
    };

    saveCurrentScenario(duplicate);
  };

  const loadScenario = (scenarioId: string) => {
    const savedScenario = scenarios.find((item) => item.id === scenarioId);
    if (!savedScenario) {
      return;
    }

    setScenario(savedScenario);
    saveActiveScenarioId(savedScenario.id);
  };

  const deleteCurrentScenario = () => {
    if (!isSaved) {
      return;
    }

    const nextScenarios = scenarios.filter((item) => item.id !== scenario.id);
    const nextScenario = nextScenarios[0] ?? createScenario();

    setScenarios(nextScenarios);
    saveScenarios(nextScenarios);
    setScenario(nextScenario);
    saveActiveScenarioId(nextScenario.id);
  };

  const resetToTemplate = () => {
    applyTemplate(scenario.templateId);
  };

  const addCategory = () => {
    const name = newCategory.name.trim();
    if (!name) {
      return;
    }

    setScenario((current) =>
      touchScenario({
        ...current,
        categories: [
          ...current.categories,
          createCategory(name, newCategory.group, Number(newCategory.percent) || 0)
        ]
      })
    );

    setNewCategory({
      name: "",
      group: "miscellaneous",
      percent: 0
    });
  };

  const updateZeroBasedMode = (enabled: boolean) => {
    setZeroBasedMode(enabled);
    saveZeroBasedMode(enabled);
  };

  const exportCsv = () => {
    downloadTextFile(
      `${slugify(scenario.name) || "salary-budget"}.csv`,
      scenarioToCsv(scenario, output),
      "text/csv;charset=utf-8"
    );
  };

  const exportJson = () => {
    const mergedScenarios = scenarios.some((item) => item.id === scenario.id)
      ? scenarios.map((item) => (item.id === scenario.id ? scenario : item))
      : [scenario, ...scenarios];

    downloadTextFile(
      "salary-budget-scenarios.json",
      JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          zeroBasedMode,
          scenarios: mergedScenarios
        },
        null,
        2
      ),
      "application/json;charset=utf-8"
    );
  };

  const importJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const importedScenarios = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.scenarios)
            ? parsed.scenarios
            : [];

        if (!importedScenarios.length) {
          window.alert("No scenarios found in the selected file.");
          return;
        }

        setScenarios(importedScenarios);
        saveScenarios(importedScenarios);
        setScenario(importedScenarios[0]);
        saveActiveScenarioId(importedScenarios[0].id);

        if (typeof parsed.zeroBasedMode === "boolean") {
          updateZeroBasedMode(parsed.zeroBasedMode);
        }
      } catch {
        window.alert("The selected file could not be imported.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const planState =
    output.totalAssignedPercent > 100
      ? {
          className: "danger",
          label: "Over",
          message: `${formatCurrency(Math.abs(output.remainingMonthlyAmount))} over`
        }
      : output.totalAssignedPercent === 100
        ? {
            className: "success",
            label: "Balanced",
            message: "All income assigned"
          }
        : {
            className: "warning",
            label: "Open",
            message: `${formatCurrency(output.remainingMonthlyAmount)} left`
          };
  const balanceNote =
    output.totalAssignedPercent > 100
      ? `${formatPercent(Math.abs(output.remainingPercent))} over`
      : output.remainingPercent === 0
        ? "Ready to save"
        : `${formatPercent(output.remainingPercent)} unassigned`;

  const stepSummaries: Record<BudgetStepId, string> = {
    pay: formatCurrency(output.monthlyIncome),
    plan: selectedTemplate?.shortName ?? "Custom",
    savings: formatCurrency(savingsMonthlyAmount),
    expenses: formatCurrency(expensesMonthlyAmount),
    finish: planState.message
  };

  const renderCategoryCard = (category: CategoryOutput) => (
    <article key={category.id} className="category-card" data-group={category.group}>
      <div className="category-info">
        <input
          className="category-name"
          value={category.name}
          onChange={(event) => updateCategory(category.id, { name: event.target.value })}
          aria-label={`${category.name} name`}
        />
        <span>{groupLabels[category.group]}</span>
      </div>

      <div className="category-money">
        <label>
          <span>Monthly {primaryCurrency}</span>
          <input
            type="number"
            min="0"
            step={primaryCurrency === "ILS" ? 100 : 25}
            value={Math.round(category.monthlyAmount)}
            onChange={(event) => updateCategoryMonthlyAmount(category.id, Number(event.target.value))}
          />
        </label>
        <span>{formatSecondaryCurrency(category.monthlyAmount)} converted</span>
      </div>

      <div className="percent-stepper" aria-label={`${category.name} percent`}>
        <button type="button" onClick={() => adjustCategoryPercent(category.id, -1)}>
          -
        </button>
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={category.percent}
          onChange={(event) =>
            updateCategory(category.id, {
              percent: roundCurrency(Math.max(0, Number(event.target.value)))
            })
          }
        />
        <button type="button" onClick={() => adjustCategoryPercent(category.id, 1)}>
          +
        </button>
      </div>

      <div className="mini-meter" aria-hidden="true">
        <span style={{ width: `${Math.min(category.percent, 100)}%` }} />
      </div>

      {category.suggestedPercent !== undefined && (
        <div className="suggestion-row">
          <span>Suggested {formatPercent(category.suggestedPercent)}</span>
          <button
            className="text-command"
            type="button"
            onClick={() => applyCategorySuggestion(category.id)}
          >
            Use
          </button>
        </div>
      )}

      <span className="paycheck-note">{formatCurrency(category.perPaycheckAmount)} per paycheck</span>

      {category.warningMessage && <span className="inline-warning">{category.warningMessage}</span>}
    </article>
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Calculator size={20} />
          </span>
          <div>
            <h1>Salary Budget Splitter</h1>
            <p>{scenario.name}</p>
          </div>
        </div>

        <div className="command-bar" aria-label="Budget commands">
          <button className="command primary" type="button" onClick={() => saveCurrentScenario()}>
            <Save size={17} />
            <span>Save</span>
          </button>
          <button className="command" type="button" onClick={() => window.print()}>
            <Printer size={17} />
            <span>Print</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <section className="app-intro" aria-label="Budget workspace">
          <div>
            <span>Personal budget studio</span>
            <h2>Place every dollar with intent.</h2>
          </div>
          <p>{scenario.name} · {formatPercent(output.totalAssignedPercent)} assigned</p>
        </section>

        <section className="kpi-grid" aria-label="Budget summary">
          <div className="kpi-card income">
            <span>Monthly income</span>
            {renderMoneyPair(output.monthlyIncome)}
            <em>{formatCurrency(output.perPaycheckIncome)} per paycheck</em>
          </div>
          <div className="kpi-card assigned">
            <span>Assigned</span>
            {renderMoneyPair(output.totalAssignedMonthlyAmount)}
            <em>{formatPercent(output.totalAssignedPercent)} of income</em>
          </div>
          <div className="kpi-card savings">
            <span>Savings</span>
            {renderMoneyPair(savingsMonthlyAmount)}
            <em>Suggested {formatPercent(suggestedSavingsPercent)}</em>
          </div>
          <div className={`kpi-card balance ${planState.className}`}>
            <span>{planState.label}</span>
            <strong>{planState.message}</strong>
            <em>{balanceNote}</em>
          </div>
        </section>

        <div className="step-stack">
          <StepSection
            id="pay"
            number={1}
            title="Pay and currency"
            summary={stepSummaries.pay}
            activeStep={activeStep}
            onStepChange={setActiveStep}
          >
            <div className="income-grid">
              <label className="field income-field">
                <span>Your pay</span>
                <input
                  type="number"
                  min="0"
                  step={primaryCurrency === "ILS" ? 100 : 100}
                  value={scenario.incomeAmount}
                  onChange={(event) => updateScenario({ incomeAmount: Number(event.target.value) })}
                  aria-label={`Income amount in ${currencyLabels[primaryCurrency]}`}
                />
              </label>

              <label className="field">
                <span>How often?</span>
                <select
                  value={scenario.incomeFrequency}
                  onChange={(event) =>
                    updateScenario({ incomeFrequency: event.target.value as IncomeFrequency })
                  }
                >
                  {Object.entries(frequencyLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="currency-grid">
              <label className="field">
                <span>Budget currency</span>
                <select
                  value={primaryCurrency}
                  onChange={(event) => changePrimaryCurrency(event.target.value as CurrencyCode)}
                >
                  <option value="USD">Dollars (USD)</option>
                  <option value="ILS">Shekels (ILS)</option>
                </select>
              </label>

              <label className="field">
                <span>ILS per USD</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={ilsPerUsd}
                  onChange={(event) =>
                    updateScenario({
                      ilsPerUsd: Math.max(0.01, Number(event.target.value) || DEFAULT_ILS_PER_USD)
                    })
                  }
                />
              </label>
            </div>

            <div className="quick-income-row" aria-label="Try example income amounts">
              {quickMonthlyIncomes.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() =>
                    updateScenario({
                      incomeAmount: amount,
                      incomeFrequency: "monthly",
                      incomeType: "take-home"
                    })
                  }
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>

            {scenario.incomeFrequency === "hourly" && (
              <label className="field solo-field">
                <span>Hours per week</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={scenario.hoursPerWeek}
                  onChange={(event) => updateScenario({ hoursPerWeek: Number(event.target.value) })}
                />
              </label>
            )}

            <details className="more-options">
              <summary>Income options</summary>
              <div className="more-options-body">
                <label className="field">
                  <span>Budget name</span>
                  <input
                    type="text"
                    value={scenario.name}
                    onChange={(event) => updateScenario({ name: event.target.value })}
                  />
                </label>

                <div className="segmented-control" role="group" aria-label="Income type">
                  <button
                    className={scenario.incomeType === "take-home" ? "active" : ""}
                    type="button"
                    onClick={() => updateScenario({ incomeType: "take-home" })}
                  >
                    Take-home
                  </button>
                  <button
                    className={scenario.incomeType === "gross" ? "active" : ""}
                    type="button"
                    onClick={() => updateScenario({ incomeType: "gross" })}
                  >
                    Gross
                  </button>
                </div>

                {scenario.incomeType === "gross" && (
                  <label className="field">
                    <span>Take-home rate</span>
                    <div className="range-input">
                      <input
                        type="range"
                        min="40"
                        max="95"
                        step="1"
                        value={Math.round(scenario.grossTakeHomeRate * 100)}
                        onChange={(event) =>
                          updateScenario({ grossTakeHomeRate: Number(event.target.value) / 100 })
                        }
                      />
                      <input
                        type="number"
                        min="40"
                        max="95"
                        step="1"
                        value={Math.round(scenario.grossTakeHomeRate * 100)}
                        onChange={(event) =>
                          updateScenario({ grossTakeHomeRate: Number(event.target.value) / 100 })
                        }
                      />
                    </div>
                  </label>
                )}

                <label className="toggle-row">
                  <span>Zero-based</span>
                  <input
                    type="checkbox"
                    checked={zeroBasedMode}
                    onChange={(event) => updateZeroBasedMode(event.target.checked)}
                  />
                </label>
              </div>
            </details>

            <div className="step-actions">
              <button className="command primary" type="button" onClick={() => setActiveStep("plan")}>
                Next: Starting plan
              </button>
            </div>
          </StepSection>

          <StepSection
            id="plan"
            number={2}
            title="Starting plan"
            summary={stepSummaries.plan}
            activeStep={activeStep}
            onStepChange={setActiveStep}
          >
            <label className="field">
              <span>Plan</span>
              <select value={scenario.templateId} onChange={(event) => applyTemplate(event.target.value)}>
                {budgetTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedTemplate && (
              <div className="template-preview">
                <strong>{selectedTemplate.shortName}</strong>
                <span>{selectedTemplate.description}</span>
              </div>
            )}

            <div className="flow-strip" aria-label="Starting split">
              <div>
                <span>Suggested saving</span>
                <strong>{formatPercent(suggestedSavingsPercent)}</strong>
              </div>
              <div>
                <span>Suggested expenses</span>
                <strong>{formatPercent(suggestedExpensePercent)}</strong>
              </div>
              <div>
                <span>Assigned now</span>
                <strong>{formatPercent(output.totalAssignedPercent)}</strong>
              </div>
            </div>

            <div className="step-actions">
              <button className="command" type="button" onClick={() => setActiveStep("pay")}>
                Back
              </button>
              <button className="command" type="button" onClick={applyAllSuggestions}>
                Use all suggestions
              </button>
              <button
                className="command primary"
                type="button"
                onClick={() => setActiveStep("savings")}
              >
                Next: Savings
              </button>
            </div>
          </StepSection>

          <StepSection
            id="savings"
            number={3}
            title="Save first"
            summary={stepSummaries.savings}
            activeStep={activeStep}
            onStepChange={setActiveStep}
          >
            <div className="flow-strip" aria-label="Savings flow">
              <div>
                <span>Saved each month</span>
                {renderMoneyPair(savingsMonthlyAmount)}
              </div>
              <div>
                <span>Suggested saving</span>
                {renderMoneyPair(suggestedSavingsMonthlyAmount)}
              </div>
              <div>
                <span>Left after saving</span>
                {renderMoneyPair(output.monthlyIncome - savingsMonthlyAmount)}
              </div>
            </div>

            <div className="suggestion-panel">
              <span>Suggested {formatPercent(suggestedSavingsPercent)}</span>
              <button
                className="command"
                type="button"
                disabled={suggestedSavingsPercent <= 0}
                onClick={() => applyGroupSuggestions("savings")}
              >
                Use savings suggestion
              </button>
            </div>

            {savingsCategories.length > 0 ? (
              <div className="category-list two-column-list">
                {savingsCategories.map(renderCategoryCard)}
              </div>
            ) : (
              <div className="empty-state">
                <PiggyBank size={18} />
                <span>No savings category yet.</span>
                <button className="command" type="button" onClick={addSavingsCategory}>
                  <Plus size={17} />
                  <span>Add savings</span>
                </button>
              </div>
            )}

            {output.remainingPercent > 0 && output.monthlyIncome > 0 && (
              <div className="fix-row" aria-label="Ways to place leftover income">
                <button className="command" type="button" onClick={addRemainingToSavings}>
                  Add leftover to savings
                </button>
                <button className="command" type="button" onClick={spreadRemaining}>
                  Spread leftover
                </button>
              </div>
            )}

            <div className="step-actions">
              <button className="command" type="button" onClick={() => setActiveStep("plan")}>
                Back
              </button>
              <button
                className="command primary"
                type="button"
                onClick={() => setActiveStep("expenses")}
              >
                Next: Expenses
              </button>
            </div>
          </StepSection>

          <StepSection
            id="expenses"
            number={4}
            title="Expenses"
            summary={stepSummaries.expenses}
            activeStep={activeStep}
            onStepChange={setActiveStep}
          >
            <div className="budget-header compact">
              <div className="budget-status">
                <div className={`status-pill ${planState.className}`}>{planState.message}</div>
                {output.totalAssignedPercent !== 100 && output.monthlyIncome > 0 && (
                  <button className="command fix-command" type="button" onClick={fixBudget}>
                    {output.remainingPercent > 0 ? "Put leftover in savings" : "Fix overage"}
                  </button>
                )}
              </div>
            </div>

            <div className="assignment-meter" aria-hidden="true">
              <span
                className={planState.className}
                style={{ width: `${Math.min(Math.max(output.totalAssignedPercent, 0), 100)}%` }}
              />
            </div>

            {output.warnings.length > 0 && (
              <div className="warning-list" aria-live="polite">
                {output.warnings.map((warning) => (
                  <div key={warning.id} className={`warning ${warning.level}`}>
                    {warning.message}
                  </div>
                ))}
              </div>
            )}

            <div className="debt-question" role="group" aria-label="Do you have debt to pay?">
              <span>Do you have debt to pay?</span>
              <div className="segmented-control">
                <button
                  className={hasDebt ? "active" : ""}
                  type="button"
                  onClick={() => updateHasDebt(true)}
                >
                  Yes
                </button>
                <button
                  className={!hasDebt ? "active" : ""}
                  type="button"
                  onClick={() => updateHasDebt(false)}
                >
                  No
                </button>
              </div>
            </div>

            <div className="expense-tabs" role="tablist" aria-label="Expense groups">
              {visibleExpenseGroups.map((group) => (
                <button
                  key={group}
                  className={`expense-tab ${group === currentExpenseGroup ? "active" : ""}`}
                  type="button"
                  role="tab"
                  aria-selected={group === currentExpenseGroup}
                  onClick={() => setActiveExpenseGroup(group)}
                >
                  <span>{groupLabels[group]}</span>
                  <small>{formatPercent(groupTotals[group] ?? 0)}</small>
                </button>
              ))}
            </div>

            <div className="expense-toolbar">
              <div className="toolbar-total">
                <span>{groupLabels[currentExpenseGroup]} total</span>
                {renderMoneyPair(activeExpenseGroupMonthlyAmount)}
              </div>
            </div>

            <div className="suggestion-panel">
              <span>
                Suggested {formatPercent(activeExpenseSuggestedPercent)} (
                {formatCurrency(activeExpenseSuggestedMonthlyAmount)})
              </span>
              <button
                className="command"
                type="button"
                disabled={activeExpenseSuggestedPercent <= 0}
                onClick={() => applyGroupSuggestions(currentExpenseGroup)}
              >
                Use group suggestion
              </button>
            </div>

            {activeExpenseCategories.length > 0 ? (
              <div className="category-list two-column-list">
                {activeExpenseCategories.map(renderCategoryCard)}
              </div>
            ) : (
              <div className="empty-state">
                <WalletCards size={18} />
                <span>No category in this group yet.</span>
                <button className="command" type="button" onClick={addExpenseCategoryForActiveGroup}>
                  <Plus size={17} />
                  <span>Add</span>
                </button>
              </div>
            )}

            <details className="more-options category-options">
              <summary>Category options</summary>
              <div className="more-options-body">
                <div className="group-summary" aria-label="Group totals">
                  {Object.entries(groupLabels).map(([group, label]) => (
                    <div key={group}>
                      <span>{label}</span>
                      <strong>{formatPercent(groupTotals[group] ?? 0)}</strong>
                    </div>
                  ))}
                </div>

                <div className="edit-category-list">
                  {scenario.categories.map((category) => (
                    <div key={category.id} className="edit-category-row">
                      <span>{category.name}</span>
                      <select
                        value={category.group}
                        onChange={(event) =>
                          updateCategory(category.id, { group: event.target.value as CategoryGroup })
                        }
                      >
                        {Object.entries(groupLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        className="icon-command"
                        type="button"
                        title={`Delete ${category.name}`}
                        onClick={() => removeCategory(category.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="add-category-grid">
                  <input
                    type="text"
                    placeholder="New category"
                    value={newCategory.name}
                    onChange={(event) =>
                      setNewCategory((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                  <select
                    value={newCategory.group}
                    onChange={(event) =>
                      setNewCategory((current) => ({
                        ...current,
                        group: event.target.value as CategoryGroup
                      }))
                    }
                  >
                    {Object.entries(groupLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={newCategory.percent}
                    onChange={(event) =>
                      setNewCategory((current) => ({
                        ...current,
                        percent: Number(event.target.value)
                      }))
                    }
                  />
                  <button className="command" type="button" onClick={addCategory}>
                    <Plus size={17} />
                    <span>Add</span>
                  </button>
                </div>

                <button className="text-command" type="button" onClick={resetToTemplate}>
                  <RotateCcw size={16} />
                  <span>Reset template</span>
                </button>
              </div>
            </details>

            <div className="step-actions">
              <button className="command" type="button" onClick={() => setActiveStep("savings")}>
                Back
              </button>
              <button
                className="command primary"
                type="button"
                onClick={() => setActiveStep("finish")}
              >
                Next: Save
              </button>
            </div>
          </StepSection>

          <StepSection
            id="finish"
            number={5}
            title="Save and export"
            summary={stepSummaries.finish}
            activeStep={activeStep}
            onStepChange={setActiveStep}
          >
            <div className="finish-summary-grid" aria-label="Final summary">
              <div>
                <span>Saved</span>
                {renderMoneyPair(savingsMonthlyAmount)}
              </div>
              <div>
                <span>Housing</span>
                {renderMoneyPair(housingCategory?.monthlyAmount ?? 0)}
              </div>
              <div>
                <span>Food</span>
                {renderMoneyPair(foodCategory?.monthlyAmount ?? 0)}
              </div>
              <div>
                <span>Left</span>
                {renderMoneyPair(output.remainingMonthlyAmount)}
              </div>
            </div>

            <div className="finish-actions">
              <button className="command primary" type="button" onClick={() => saveCurrentScenario()}>
                <Save size={17} />
                <span>Save</span>
              </button>
              <button className="command" type="button" onClick={() => window.print()}>
                <Printer size={17} />
                <span>Print</span>
              </button>
              <button className="command" type="button" onClick={exportCsv}>
                <FileDown size={17} />
                <span>CSV</span>
              </button>
            </div>

            <details className="more-options tools-options">
              <summary>More tools</summary>
              <div className="more-options-body">
                <label className="field">
                  <span>Saved budgets</span>
                  <select
                    value={isSaved ? scenario.id : ""}
                    onChange={(event) => loadScenario(event.target.value)}
                  >
                    {!isSaved && <option value="">Current budget</option>}
                    {scenarios.length === 0 && <option value="">No saved budgets</option>}
                    {scenarios.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="tool-grid">
                  <button className="command" type="button" onClick={() => setScenario(createScenario())}>
                    <Plus size={17} />
                    <span>New</span>
                  </button>
                  <button className="command" type="button" onClick={duplicateScenario}>
                    <Copy size={17} />
                    <span>Copy</span>
                  </button>
                  <button className="command" type="button" onClick={exportJson}>
                    <Download size={17} />
                    <span>Backup</span>
                  </button>
                  <button
                    className="command"
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                  >
                    <Upload size={17} />
                    <span>Import</span>
                  </button>
                  <button
                    className="command danger-text"
                    type="button"
                    disabled={!isSaved}
                    onClick={deleteCurrentScenario}
                  >
                    <Trash2 size={17} />
                    <span>Delete</span>
                  </button>
                </div>

                <input
                  ref={importInputRef}
                  className="visually-hidden"
                  type="file"
                  accept="application/json"
                  onChange={importJson}
                />
              </div>
            </details>

            <div className="step-actions">
              <button className="command" type="button" onClick={() => setActiveStep("expenses")}>
                Back
              </button>
            </div>
          </StepSection>
        </div>
      </main>
    </div>
  );
}

export default App;
