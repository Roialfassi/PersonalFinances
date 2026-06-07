# Personal Budgeting Site - Research and Plan

Research date: 2026-06-06  
Workspace status: empty directory, not currently a git repository  
Assumption: this is a greenfield budgeting web app for a US-oriented audience

## Goal

Create a web app that takes a user's salary or take-home income and turns it into a clear budget split across practical categories like housing, food, utilities, transportation, savings, debt, giving, personal spending, and miscellaneous.

The first screen should be the usable salary budget calculator, not a marketing landing page.

## Narrowed Product Direction

The product should be a salary allocation tool, not a full personal-finance tracker.

The user enters income, chooses or customizes a budgeting template, and immediately sees how much money should go into each category per month, per paycheck, and per year. The app should feel similar in spirit to a Ramsey-style percentage budget or zero-based budget, but it should not copy or depend on Dave Ramsey's Baby Steps. The core job is salary budgeting only.

The MVP should answer one practical question:

```text
Given this income, how should I divide it up?
```

Primary output:

- Recommended dollar amount per category
- Percentage per category
- Remaining unassigned income
- Warnings when a category is too high or the plan exceeds income
- A clean budget summary the user can save, print, or export

## Research Summary

### Budgeting basics

Consumer.gov explains budgeting as a written monthly plan that shows how much money a person makes and how they spend it. Their recommended starter flow is simple: gather bills and pay stubs, list monthly bills and expenses, list monthly income, subtract expenses from income, then adjust if the result is below zero.

Product decision:

- Onboarding should start with income, pay frequency, and budget categories.
- The app should show a clear "income minus assigned budget" number during setup.
- Savings should be treated as a budget line item, not just leftover money.

Source: [Consumer.gov - Making a Budget](https://consumer.gov/your-money/making-budget)

### Current spending must be realistic

The CFPB recommends users examine several months of checking and credit card history, save receipts or use a spending tracker, include miscellaneous spending, include emergency fund contributions, and account for less frequent expenses like insurance, medical costs, seasonal costs, gifts, charity, and vacations.

Product decision:

- The app can include an optional "current expenses" check, but it should not require transaction tracking.
- It should include a miscellaneous category by default.
- It should support non-monthly expenses by letting users create monthly set-aside categories.
- It should let users compare planned category percentages against recommended ranges.

Source: [CFPB - Assess your spending](https://www.consumerfinance.gov/owning-a-home/prepare/assess-your-spending/)

### 50/30/20 is useful as a starter heuristic

A CFPB worksheet frames one budgeting rule as 50 percent of monthly net income for needs, 30 percent for wants, and 20 percent for savings goals.

Product decision:

- Use 50/30/20 as an optional starter template, not a rigid rule.
- Let users customize target percentages because housing, debt, family obligations, and income volatility can make the default unrealistic.
- Show actual percentages beside dollar amounts so users can learn where their money goes.

Source: [CFPB - Analyzing budgets worksheet](https://www.consumerfinance.gov/documents/8353/cfpb_building_block_activities_analyzing-budgets_worksheet.pdf)

### Zero-based and envelope budgeting patterns

YNAB's method centers on assigning available money to categories before spending it, then moving money between categories when reality changes. The useful pattern is not the branding; it is the behavior of forcing every available dollar into a job and making tradeoffs visible.

Product decision:

- Offer a "give every dollar a job" mode for users who want tight control.
- Support moving money between categories without making the user feel like the budget has failed.
- Separate "planned" from "available" so users can budget only money they actually have.

Source: [YNAB - The Method](https://www.ynab.com/the-four-rules)

### Ramsey-style salary budget patterns

Ramsey Solutions describes zero-based budgeting as assigning every dollar a job so that income minus expenses equals zero. Their current budgeting materials also emphasize entering monthly take-home income, calculating recommended category amounts, adjusting those amounts to fit the user's situation, covering core needs first, and keeping housing at or under a target percentage of take-home pay.

Product decision:

- The app should use take-home income as the main input.
- The default experience should be a salary split calculator.
- A zero-based toggle should require the plan to assign 100 percent of income.
- Category percentages should be editable because user circumstances vary.
- The app should visually prioritize core needs such as housing, utilities, food, and transportation before optional spending.
- The app should avoid copying Ramsey's Baby Steps or presenting a branded Ramsey plan.

Sources:

- [Ramsey Solutions - Budget Percentages](https://www.ramseysolutions.com/budgeting/budget-percentages)
- [Ramsey Help Center - What is a Zero-Based Budget?](https://help.ramseysolutions.com/hc/en-us/articles/360047082171-What-is-a-Zero-Based-Budget)

### Competitor product patterns

Monarch highlights two budgeting modes: a more flexible budget and a category budget. That suggests users differ in how much structure they want.

Rocket Money highlights account linking, balance alerts, subscription management, and spend tracking. These are important expectations in modern budgeting tools, but bank linking should not be required for a first version.

Product decision:

- MVP should focus on manual income entry, templates, and category percentage editing.
- Add two budgeting modes: flexible percentage split and zero-based split.
- Treat transaction tracking, subscription detection, and bank-linking as optional later expansions.
- Include budget pressure alerts based on category percentages, not account balances.

Sources:

- [Monarch - Budgeting](https://www.monarch.com/features/budgeting)
- [Rocket Money](https://www.rocketmoney.com/)

### Bank-linking integration path

Plaid's quickstart shows a common flow: the backend creates a link token, the client opens Plaid Link, the success callback returns a public token, and the server exchanges it for an access token that must be securely stored.

Product decision:

- Bank linking is not needed for the salary budgeting MVP.
- If the product later expands into transaction tracking, bank linking should come after authentication, encryption, consent, data deletion, and secure token storage are in place.
- MVP should avoid storing bank credentials or access tokens.
- If using Plaid later, isolate the integration behind a server-side service and never expose access tokens to the browser.

Source: [Plaid Docs - Quickstart](https://plaid.com/docs/quickstart/)

### Security and privacy constraints

The FTC Safeguards Rule is aimed at covered financial institutions, but its principle is directly relevant: organizations handling customer financial information need safeguards to protect that information. OWASP lists the current Top 10 web application security risks for 2025, including broken access control, security misconfiguration, software supply chain failures, cryptographic failures, injection, insecure design, authentication failures, and logging or alerting failures.

Product decision:

- Treat financial data as sensitive from day one.
- Minimize data collection in the MVP.
- Avoid third-party trackers on authenticated pages.
- Use secure defaults: HTTPS, input validation, least privilege, dependency scanning, and no secrets in client code.
- Do not add bank-linking, multi-user sharing, or AI advice until data security is designed.

Sources:

- [FTC - Safeguards Rule guidance](https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know)
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)

## Target Users

Primary users:

- People who have a salary or paycheck amount and want a simple way to divide it.
- People who want budget category guidance without learning a full financial program.
- People who want a Ramsey-like percentage budget but not the Baby Steps.
- People deciding whether their housing, car, food, or lifestyle costs fit their income.

Secondary users:

- Users comparing several salaries, jobs, or living situations.
- Users who already budget in spreadsheets and want a cleaner salary split workflow.
- Users who want a printable or exportable monthly budget.

## Product Positioning

Working name: Salary Budget Splitter

Core promise:

Salary Budget Splitter helps users enter an income and instantly divide it into a realistic monthly budget.

The app should feel calm, practical, and direct. It should avoid shaming language, gamified pressure, and generic financial advice. The product should show category tradeoffs clearly and let users decide.

## Product Principles

1. Start with income.
   The app should first ask what money the user has to work with, then divide it into categories.

2. Make the split visible.
   Users should always see each category as both a percentage and a dollar amount.

3. Budgeting is adjustment.
   A budget should be editable without penalty. Changing one category should clearly show how it affects the rest.

4. Calculator-first, tracking later.
   The MVP should not need bank accounts, transaction history, or CSV import to be useful.

5. Privacy is a product feature.
   Do not collect financial data that is not needed for the current feature.

6. No personalized investment, tax, or debt advice in MVP.
   The app can calculate, organize, and explain. It should not claim to be a financial advisor.

## Information Architecture

### Main routes for MVP

- `/` - Salary budget calculator
- `/templates` - Budget split templates
- `/scenarios` - Saved budget scenarios
- `/settings` - Currency, pay frequency, category defaults, export, and reset

### First screen

The first screen should be the calculator itself.

It should show:

- Income input
- Pay frequency selector
- Take-home vs gross income toggle
- Template selector
- Category split table
- Percentage controls
- Dollar amounts per month, paycheck, and year
- Remaining unassigned amount
- Zero-based balance indicator
- Warnings for high-pressure categories
- Save, print, and export actions

No marketing hero is needed inside the app.

## Core User Workflows

### Salary split workflow

1. User enters income.
2. User chooses whether the number is monthly, annual, weekly, biweekly, twice monthly, or hourly.
3. If gross income is entered, the app can either ask for estimated take-home pay or apply a clearly labeled rough estimate.
4. User selects a template: simple needs/wants/savings, Ramsey-inspired categories, aggressive savings, debt-heavy, or custom.
5. App calculates budget amounts for each category.
6. User adjusts percentages with sliders or numeric inputs.
7. App keeps the total visible and warns if the plan is over or under 100 percent.
8. User saves the scenario, prints it, or exports it.

### Category customization workflow

1. User adds, removes, renames, or reorders categories.
2. User marks categories as essential, flexible, savings, debt, giving, or miscellaneous.
3. User changes percentage targets.
4. App recalculates dollar amounts immediately.
5. App shows which categories changed and how much income remains.

### Scenario comparison workflow

1. User saves one salary budget.
2. User duplicates it and changes income, housing, savings, or debt percentages.
3. App shows side-by-side differences.
4. User can compare monthly and annual impact.

### Print and export workflow

1. User clicks print or export.
2. App creates a summary with income, template, category percentages, monthly amounts, paycheck amounts, and notes.
3. User can export JSON for backup or CSV for spreadsheet use.

## MVP Scope

### Include in MVP

- Responsive web app
- Income input for annual, monthly, weekly, biweekly, twice-monthly, and hourly income
- Take-home income as the recommended default
- Optional gross-to-net estimate with clear labeling
- Budget split templates
- 50/30/20 starter template
- Ramsey-inspired category template without Baby Steps
- Custom category percentages
- Slider and direct-number controls
- Zero-based mode where assigned categories must equal 100 percent
- Category groups for essentials, lifestyle, savings, debt, giving, and miscellaneous
- Monthly, per-paycheck, and annual budget amounts
- Remaining unassigned or over-assigned amount
- Warnings for high housing, high debt, low savings, or totals over 100 percent
- Saved scenarios
- Scenario duplication and comparison
- Printable budget summary
- CSV export
- Local data export and import
- Privacy-first data controls

### Exclude from MVP

- Bank account linking
- Transaction tracking
- CSV transaction import
- Recurring bill tracking
- Subscription detection
- Credit score monitoring
- Investment tracking
- Bill negotiation
- Subscription cancellation service
- Personalized financial advice
- Multi-user household sharing
- Mobile native apps
- AI assistant
- Paid plans

## Recommended Tech Plan

Because the workspace is empty, start with a small, maintainable frontend-first app.

### Frontend

- Vite
- React
- TypeScript
- CSS modules or Tailwind CSS
- Recharts for charts
- Lucide React for icons
- React Hook Form plus Zod for form validation

### Local MVP persistence

- LocalStorage for simple saved scenarios, or IndexedDB through Dexie if the saved data grows
- Export and import as JSON
- CSV export for spreadsheet use

Rationale:

- Keeps the first version useful without backend accounts.
- Avoids storing sensitive financial data on a server before security and privacy policy work is done.
- Allows quick iteration on the salary split calculator.

### Later backend

When user accounts and sync are needed:

- Next.js or a Vite frontend plus API backend
- Postgres for durable data
- Auth with passkeys or email magic links
- Server-side encryption strategy for sensitive fields
- Transaction tracking and bank integration only after auth, consent, deletion, and secure storage are implemented

## Data Model

### UserSettings

- `id`
- `currency`
- `defaultPayFrequency`
- `defaultIncomeType`
- `defaultTemplateId`
- `zeroBasedMode`
- `createdAt`
- `updatedAt`

### BudgetTemplate

- `id`
- `name`
- `description`
- `categories`
- `isBuiltIn`
- `createdAt`

Built-in template examples:

- simple-50-30-20
- ramsey-inspired-categories
- aggressive-savings
- debt-heavy
- custom-blank

### Category

- `id`
- `name`
- `group`
- `targetPercent`
- `minRecommendedPercent`
- `maxRecommendedPercent`
- `isEssential`
- `sortOrder`

Category groups:

- essentials
- lifestyle
- savings
- debt
- giving
- miscellaneous

### BudgetScenario

- `id`
- `name`
- `incomeAmount`
- `incomeFrequency`
- `incomeType`
- `estimatedTakeHomeAmount`
- `templateId`
- `categories`
- `notes`
- `createdAt`
- `updatedAt`

Income frequencies:

- annual
- monthly
- twice-monthly
- biweekly
- weekly
- hourly

Income types:

- take-home
- gross

### BudgetOutput

- `scenarioId`
- `monthlyIncome`
- `annualIncome`
- `perPaycheckIncome`
- `totalAssignedPercent`
- `totalAssignedMonthlyAmount`
- `remainingMonthlyAmount`
- `categoryOutputs`
- `warnings`

### CategoryOutput

- `categoryId`
- `name`
- `group`
- `percent`
- `monthlyAmount`
- `perPaycheckAmount`
- `annualAmount`
- `warningLevel`

## Key Calculations

### Normalize income to monthly

```text
monthlyIncome = incomeAmount * frequencyMultiplier
```

Frequency multipliers:

- annual: `1 / 12`
- monthly: `1`
- twice-monthly: `2`
- biweekly: `26 / 12`
- weekly: `52 / 12`
- hourly: `hourlyRate * hoursPerWeek * 52 / 12`

### Category amount

```text
categoryMonthlyAmount = monthlyIncome * (categoryPercent / 100)
```

### Per-paycheck amount

```text
categoryPerPaycheckAmount = categoryAnnualAmount / paychecksPerYear
```

### Total assigned

```text
totalAssignedPercent = sum(categoryPercent)
remainingPercent = 100 - totalAssignedPercent
remainingMonthlyAmount = monthlyIncome * (remainingPercent / 100)
```

### Zero-based balance

```text
zeroBasedBalance = monthlyIncome - sum(categoryMonthlyAmount)
```

In zero-based mode, the target is:

```text
zeroBasedBalance = 0
```

### Guideline warnings

```text
if categoryPercent > maxRecommendedPercent:
  warning = "high"

if categoryPercent < minRecommendedPercent:
  warning = "low"

if totalAssignedPercent > 100:
  warning = "over-assigned"
```

## UX and Visual Direction

The app should feel like an operational finance tool: quiet, structured, and easy to scan.

Design guidance:

- Use a dense calculator layout with clear totals.
- Avoid oversized marketing sections.
- Use compact cards only for repeated items like category rows, scenarios, templates, and alerts.
- Use tabs for budget views.
- Use icon buttons for common actions like edit, delete, import, export, and add.
- Use progress bars for category allocation and scenario differences.
- Use restrained color with semantic emphasis:
  - green for balanced or available income
  - red for over-assigned income
  - amber for warnings
  - neutral grays for structure
- Keep all numbers readable on mobile.
- Support keyboard navigation and screen-reader labels.

## Page-Level Plan

### Salary Budget Calculator

Purpose:

Turn income into category amounts immediately.

Core components:

- Income amount input
- Income frequency selector
- Take-home vs gross toggle
- Hours per week input for hourly users
- Template selector
- Category split table
- Sliders and numeric percentage inputs
- Monthly, per-paycheck, and yearly amount columns
- Remaining percent and dollar summary
- Zero-based balance indicator
- Warnings panel
- Save, duplicate, print, and export actions

### Templates

Purpose:

Let users start from a useful split instead of a blank page.

Core components:

- 50/30/20 template
- Ramsey-inspired category template
- Aggressive savings template
- Debt-heavy template
- Custom blank template
- Template preview
- Apply template action

### Scenarios

Purpose:

Let users save and compare different salary budgets.

Core components:

- Saved scenario list
- Duplicate scenario action
- Rename scenario action
- Side-by-side comparison
- Monthly difference summary
- Annual difference summary

### Export and Print

Purpose:

Give users a clean budget they can keep outside the app.

Core components:

- Print-friendly summary
- CSV export
- JSON backup export
- JSON backup import

### Settings

Purpose:

Control defaults, categories, and privacy.

Core components:

- Currency
- Default pay frequency
- Default template
- Category defaults
- Export data
- Import backup
- Delete local data
- Privacy summary

## Build Phases

### Phase 1 - Planning and scaffold

- Create Vite React TypeScript app.
- Add routing, layout, design tokens, and responsive shell.
- Add default templates.
- Add salary budget calculator layout.
- Implement income normalization calculations.

Exit criteria:

- User can enter income and see calculated budget category amounts.

### Phase 2 - Templates and customization

- Add 50/30/20 template.
- Add Ramsey-inspired category template.
- Add aggressive savings and debt-heavy templates.
- Add custom category editing.
- Add sliders and numeric percentage fields.
- Add over-assigned and under-assigned warnings.

Exit criteria:

- User can choose a template, customize percentages, and balance the budget.

### Phase 3 - Scenarios and persistence

- Add local saved scenarios.
- Add duplicate and rename scenario actions.
- Add scenario comparison.
- Add JSON export and import.

Exit criteria:

- User can save multiple salary budgets and compare them.

### Phase 4 - Export, print, and polish

- Add print-friendly budget summary.
- Add CSV export.
- Add empty states.
- Add mobile refinements.
- Add accessible form labels and keyboard support.
- Add unit tests for calculations.

Exit criteria:

- User can create, adjust, save, print, and export a salary budget on desktop and mobile.

### Phase 5 - Optional expansion

- Add actual spending tracker.
- Add recurring bill planner.
- Add savings goal planner.
- Add account sync only after a backend and privacy model exist.

Exit criteria:

- Product can expand beyond salary budgeting without bloating the MVP.

## Testing Plan

### Unit tests

- Income normalization across annual, monthly, twice-monthly, biweekly, weekly, and hourly inputs
- Per-paycheck calculation
- Category amount calculation
- Total assigned percent calculation
- Remaining amount calculation
- Zero-based balance calculation
- 50/30/20 percentage calculation
- Guideline warning calculation
- CSV export formatting

### Integration tests

- Entering income generates a budget split.
- Applying a template updates all categories.
- Editing a percentage recalculates dollar amounts.
- Zero-based mode detects over-assigned and under-assigned plans.
- Saving a scenario persists it locally.
- Duplicating a scenario preserves values.
- Export and import preserve scenarios.

### UI checks

- Desktop calculator
- Mobile calculator
- Empty income state
- Over-assigned state
- Under-assigned state
- Long category names
- Print layout
- Keyboard navigation through sliders, inputs, and tables

## Risks and Mitigations

### Risk: Percentage recommendations feel too generic

Mitigation:

- Provide multiple templates.
- Make every category editable.
- Show warnings as guidance, not hard rules.
- Let users create custom templates.

### Risk: Users enter gross income and expect precise take-home results

Mitigation:

- Recommend take-home income as the default.
- Label gross-to-net estimates clearly.
- Avoid tax advice.
- Let users manually override take-home pay.

### Risk: Sensitive financial data exposure

Mitigation:

- Local-first MVP.
- No third-party trackers on app pages.
- Export and delete controls.
- Security review before backend sync.

### Risk: Users confuse budget guidance with financial advice

Mitigation:

- Label calculations as estimates.
- Avoid investment, tax, or legal advice.
- Provide source-backed educational text only where useful.

## Open Product Questions

- Should the default income input ask for monthly take-home pay or annual salary first?
- Should zero-based mode be enabled by default?
- Which category split should be the default: 50/30/20 or Ramsey-inspired categories?
- Should the app include a rough gross-to-net estimator, or should it only accept take-home income?
- Should saved scenarios use LocalStorage only, or IndexedDB from the start?

## Recommended First Implementation Step

Start with Phase 1 and Phase 2:

1. Scaffold a Vite React TypeScript app.
2. Build the salary budget calculator as the first screen.
3. Add income frequency conversion.
4. Add templates and editable category percentages.
5. Implement the budget math with unit tests.

This gives the project a usable salary budgeting core before taking on tracking, bank-linking, or accounts.
