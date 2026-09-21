# Personal Budget Tracker

A beautifully minimal, Apple-inspired personal budget tracker web app designed for students and individuals. 

Built with React 19, TypeScript, and Tailwind CSS v4.

## Features

- **Private & Local**: Zero onboarding, zero authentication. All of your financial data is saved locally in your browser's `localStorage`. No data ever leaves your device.
- **Precise Integer Math**: All money calculations are performed securely using integer cents to entirely eliminate floating-point arithmetic errors. 
- **Apple-Inspired Editorial Design**: Clean typography (Inter and DM Mono), lots of whitespace, frosted-glass headers, soft shadows, and hairline dividers. 
- **Four Distinct Views**:
  - **Home**: A monthly dashboard for quick expense logging, income tracking, and high-level statistical breakdowns.
  - **Wallet**: A net-worth tracker featuring credit-card style gradient tiles for your checking, savings, cash, and credit accounts.
  - **Expenses**: A detailed spending history alongside a recurring bills planner with overdue warnings.
  - **People**: A unified ledger for tracking exactly who owes you money (or who you owe) complete with progress bars and settlement logic.
- **Data Safety**: Easily export a `.json` backup of your entire ledger at any time. Recover seamlessly with the built-in import functionality.
- **PWA Ready**: Installable to your phone's home screen for a native app-like experience.

## Tech Stack

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zod](https://zod.dev/) (for data schema validation)
- [Vitest](https://vitest.dev/) (for unit testing)

## Local Development

To run the project locally:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```

To run the test suite:
```bash
npm run test
```

## Deployment

This app is configured to deploy automatically as a static site to GitHub Pages via a GitHub Actions workflow whenever changes are pushed to the `master` branch.
