# Salary Budget Splitter

A simple local-first budgeting app that helps users turn income into a practical monthly budget split.

The app is built around an easy flow:

1. Enter take-home pay.
2. Choose a starting budget plan.
3. Adjust category dollars or percentages.
4. Save, print, or export the plan.

## Features

- Income entry for monthly, annual, weekly, biweekly, twice-monthly, and hourly pay
- Take-home and gross income modes
- Ramsey-inspired, 50/30/20, savings-focused, debt-focused, and custom templates
- Direct monthly dollar editing per category
- Percent stepper controls
- One-click fixes for leftover or over-budget plans
- Local saved budget scenarios
- Print, CSV export, and JSON backup/import
- Local-first storage with no backend or bank-linking

## Tech Stack

- React
- TypeScript
- Vite
- Vitest
- Lucide React icons

## Getting Started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```text
src/
  data/
    templates.ts      Budget templates and default categories
  lib/
    budget.ts         Budget math and warnings
    exporters.ts      CSV and file export helpers
    storage.ts        LocalStorage helpers
    budget.test.ts    Budget calculation tests
  App.tsx             Main app UI
  styles.css          App styling
```

## Notes

This app stores saved scenarios locally in the browser. It does not connect to bank accounts, store server-side financial data, or provide financial advice.

