# AGENTS.md — PocketGo Development Guide

## Project

This project is **PocketGo: Track Your Money**.

PocketGo is a mass-market personal finance web app. It helps ordinary people track money, understand cashflow, control spending, manage bills, track debt/paylater, build financial goals, forecast future balances, and know how much is safe to spend today.

Before making changes, always read:

1. `PRD.md`
2. This `AGENTS.md`

The product must be built for broad public financial problems, not for one specific user’s personal finance case.

---

## Product Philosophy

PocketGo is not just an expense tracker.

PocketGo must help users answer:

* How much money do I really have?
* How much is safe to spend today?
* Will my money last until payday?
* What bills are coming soon?
* Where is my money leaking?
* Are my small purchases becoming a problem?
* Is my debt or paylater getting risky?
* Are my goals realistic?
* What should I do next?

The app should turn financial data into decisions.

A normal tracker shows history.

PocketGo must show:

* current situation
* future risk
* practical next action

---

## Target Users

Build for broad user groups:

1. Beginners who have never tracked money.
2. Workers living paycheck-to-paycheck.
3. People with monthly, weekly, daily, or irregular income.
4. Students and young adults.
5. Families and households.
6. Debt, credit card, and paylater users.
7. Freelancers and gig workers.
8. Small business and side-hustle users.
9. Cash-heavy users.
10. Privacy-conscious users who do not want forced bank sync.

Do not design only for advanced finance users.

Do not assume users understand budgeting terms.

Use simple language and helpful guidance.

---

## Core Priorities

Always prioritize:

1. Correct transaction logic.
2. Correct wallet balance sync.
3. Correct transfer handling.
4. No double-counting transfers as income or expense.
5. Safe to Spend calculation.
6. Upcoming bill visibility.
7. Debt/paylater visibility.
8. Cashflow forecast.
9. Supabase RLS and privacy.
10. Mobile-first usability.
11. Simple, elegant, calm UI.
12. Helpful empty states.
13. No fake data in production user accounts.
14. Successful build with no TypeScript errors.

---

## Tech Stack

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* Supabase
* React Router
* Lucide React
* date-fns
* Recharts or another lightweight chart library

If the repo already has a working setup, inspect it first and adapt carefully.

Do not break existing build config.

---

## Product Rules

PocketGo must not become accounting software.

PocketGo must feel:

* simple
* practical
* trustworthy
* elegant
* mobile-first
* calm
* helpful

Avoid:

* spreadsheet-like UI
* accounting jargon
* too many charts on Home
* too many colors
* guilt-based copy
* overcomplicated forms
* fake demo data in real accounts
* advanced features before core logic works

---

## Transaction Rules

Amounts must always be stored as positive numbers.

Transaction type determines balance effect.

Supported transaction types:

* `income`
* `expense`
* `transfer_out`
* `transfer_in`
* `adjustment`

Rules:

* `income` increases wallet balance.
* `expense` decreases wallet balance.
* `adjustment` corrects wallet balance.
* `transfer_out` decreases source wallet.
* `transfer_in` increases destination wallet.

Transfers must create two linked rows with the same `transfer_group_id`:

1. `transfer_out` from source wallet.
2. `transfer_in` to destination wallet.

Transfers must be excluded from:

* income reports
* expense reports
* budget spending
* category spending
* savings rate calculation

When editing a transaction:

1. Reverse the old balance effect.
2. Apply the new balance effect.

When deleting a transaction:

1. Reverse the transaction effect.
2. Delete the transaction.

For transfer edit/delete:

* update both linked rows
* reverse both wallet effects
* do not leave orphan transfer rows

Centralize balance sync logic.

Do not duplicate balance logic across many components.

---

## Wallet Rules

Wallet types:

* cash
* bank
* ewallet
* credit_card
* paylater
* savings
* investment
* business
* loan
* other

Rules:

* Wallet balance must always match transaction history plus adjustments.
* Archived wallets should not appear in default transaction input.
* Archived wallets must remain available for historical reports.
* Wallets can be included or excluded from total balance.
* Credit card and paylater can be supported in V1 as wallet/debt types, but advanced repayment behavior can be improved later.

---

## Category Rules

Default categories should serve broad public needs.

Expense examples:

* Food & Drinks
* Groceries
* Transport
* Fuel
* Bills
* Rent / Housing
* Electricity
* Internet
* Phone / Data
* Family Support
* Health
* Debt Payment
* Paylater
* Shopping
* Online Shopping
* Entertainment
* Social / Hangout
* Education
* Children
* Donation / Charity
* Business Expense
* Maintenance / Repair
* Subscription
* Emergency
* Fees / Admin
* Cash Withdrawal
* Other

Income examples:

* Salary
* Business Income
* Freelance
* Bonus
* Gift
* Cashback
* Investment Income
* Debt Repayment Received
* Allowance
* Other

System categories:

* Transfer
* Adjustment
* Opening Balance

Used categories should not be hard deleted.

Archive instead.

---

## Supabase Rules

Use Supabase Auth.

All user-owned tables must have RLS enabled.

Users can only select, insert, update, and delete their own data.

For `profiles`:

* `id = auth.uid()`

For user-owned tables:

* `user_id = auth.uid()`

For future household tables:

* only active household members can access household-owned data

Never expose another user’s data.

Never insert fake transactions into real user accounts.

If demo data is needed:

* make it local-only
* or clearly separate it as demo mode
* never mix demo data with real user production data

---

## Safe to Spend Rules

Safe to Spend is a core feature.

It should estimate how much the user can safely spend today without hurting bills, debt payments, goals, and basic needs.

Inputs:

* active included wallet balances
* upcoming recurring expenses
* subscriptions
* debt payments
* goal commitments
* emergency buffer
* days until next income
* or days until end of month if income date is unknown

Formula direction:

```txt
available_balance =
sum active included wallet balances

required_until_next_income =
upcoming bills + recurring expenses + subscriptions + debt payments

goal_commitments =
planned goal contributions due before next income

buffer =
10% of required_until_next_income

safe_to_spend_total =
available_balance - required_until_next_income - goal_commitments - buffer

safe_to_spend_today =
safe_to_spend_total / days_until_next_income
```

Safe to Spend status:

* Safe
* Caution
* Danger

Example copy:

* “Safe. You can spend around Rp85.000 today.”
* “Careful. Safe money today is only Rp35.000.”
* “Risky. Upcoming bills are higher than your available balance.”

Never show misleading confidence if data is incomplete.

If data is incomplete, show assumptions.

---

## Forecast Rules

Forecast should project balance for:

* 7 days
* 30 days

Inputs:

* current balance
* recurring income
* recurring expenses
* subscriptions
* debt payments
* planned goal contributions
* optional average daily spending

Outputs:

* daily projected balance
* lowest balance
* caution dates
* danger dates
* short explanation

Example copy:

* “Cashflow looks safe for the next 7 days.”
* “Balance may go below Rp0 on 24 July.”
* “Lowest projected balance is Rp180.000.”
* “Reduce daily spending by Rp25.000 to stay safe.”

Forecast must not crash when data is incomplete.

---

## Debt and Paylater Rules

Debt visibility is core.

Debt/paylater users must be able to see:

* total remaining debt
* total monthly payment
* due dates
* remaining balance
* installment amount
* minimum payment
* debt-to-income warning

Debt status:

* Healthy
* Watch
* Heavy
* Risky

Example copy:

* “Debt payment is manageable.”
* “Debt payment is getting high compared to income.”
* “Avoid taking new installments this month.”
* “This payment is due in 3 days.”

Do not shame users.

Warn clearly and practically.

---

## Money Leak Detection Rules

Detect common leaks:

1. Small frequent transactions.
2. Category spending growing faster than usual.
3. Repeated merchant spending.
4. Subscription accumulation.
5. Paylater stacking.
6. Weekend spending spikes.
7. Online shopping bursts.
8. Delivery food increase.
9. Cash withdrawals with unclear usage.
10. Fees and admin charges.

Example copy:

* “Small purchases under Rp30.000 reached Rp480.000 this month.”
* “Food delivery spending is 32% higher than last month.”
* “You paid this merchant 9 times this month.”
* “Subscriptions are taking a bigger share of your monthly income.”

Insights must be actionable.

---

## Advisor Rules

Advisor cards are rule-based in V1.

Generate cards for:

* budget almost exceeded
* budget exceeded
* bill due soon
* debt due soon
* forecast balance below zero
* spending increased from previous month
* subscription total high
* no emergency fund goal
* goal behind schedule
* Safe to Spend low
* cash runway low
* repeated small transactions
* income lower than usual

Advisor card format:

* title
* body
* action_text
* severity
* source

Severity:

* info
* success
* warning
* danger

Tone:

* helpful
* short
* practical
* non-judgmental

Bad:

> “You are overspending.”

Good:

> “This category is getting tight. Keep daily spending below Rp35.000 to stay safe.”

---

## UI Rules

The UI must feel:

* simple
* elegant
* premium
* calm
* trustworthy
* mobile-first
* easy to understand

Use:

* rounded cards
* soft shadows
* clean typography
* spacious layout
* minimal icons
* helpful empty states
* smooth subtle animations
* bottom navigation on mobile
* sidebar on desktop
* clean charts

Avoid:

* spreadsheet-like layout
* accounting software feel
* too many colors
* dense tables on mobile
* too many charts on Home
* childish gamification
* unnecessary complexity

Home should show answers first, charts second.

---

## Mobile Rules

Very important:

* All pages must work well on mobile.
* Bottom navigation must not cover important buttons.
* Forms must be scrollable.
* Modals and sheets must be scrollable.
* Plan, Insight, More, and Add Transaction must not get stuck.
* Avoid fixed heights that block scrolling.
* Use safe-area padding.
* Add enough bottom padding above bottom navigation.
* Floating action button must not block submit buttons.
* Numeric amount input should open numeric keyboard on mobile.

---

## Navigation Rules

Use 5 main areas:

1. Home
2. Transactions
3. Plan
4. Insight
5. More

Home is for decisions.

Transactions is for records.

Plan is for the future.

Insight is for learning.

More is for configuration and data management.

---

## Home Requirements

Home must show:

* greeting
* total balance
* Safe to Spend Today
* cash runway or payday countdown
* 7-day forecast
* upcoming bills
* money leak alert
* debt/paylater warning
* goal progress
* advisor cards
* quick add transaction button

Home should answer the user’s real financial situation quickly.

Do not overload Home with complex analytics.

---

## Transactions Requirements

Transactions page must support:

* list grouped by date
* search
* filter by type
* filter by wallet
* filter by category
* filter by date
* add
* edit
* delete
* transfer display
* empty state

Transaction logic must be correct before UI polish.

---

## Plan Requirements

Plan page must include:

* budget
* cashflow forecast
* bills and recurring items
* goals
* debts/paylater
* what-if simulator teaser

Plan must help users prepare, not just view data.

---

## Insight Requirements

Insight page must include:

* income vs expense
* spending by category
* biggest leaks
* top merchants
* budget performance
* net worth summary
* debt summary
* financial health score
* advisor summary

Charts should be clean and easy to understand.

Every chart should answer a practical question.

---

## Empty State Rules

Every page must have useful empty states.

Wallet empty:

> “Add your first wallet so PocketGo knows where your money is stored.”

Transaction empty:

> “No transactions yet. Add your first transaction and PocketGo will start finding patterns.”

Budget empty:

> “Create a budget so PocketGo can estimate what is safe to spend.”

Goal empty:

> “Create your first goal, such as emergency fund, vehicle, education, or vacation.”

Debt empty:

> “No debts yet. Add paylater, credit card, or loan records if you have them.”

Insight empty:

> “Add a few transactions to unlock spending insights.”

---

## Copy Rules

Copy must be:

* short
* clear
* helpful
* specific
* action-oriented
* non-judgmental

Use language normal people understand.

Avoid finance jargon unless explained.

Avoid guilt.

Examples:

* “Safe until payday.”
* “Safe money today.”
* “This category is getting tight.”
* “Upcoming bill in 3 days.”
* “Small purchases are adding up.”
* “This goal needs a higher monthly saving.”
* “Try reducing daily spending by Rp25.000.”

---

## Development Order

Follow this order:

## Phase 1 — Foundation

1. Inspect repo.
2. Set up or adapt React + TypeScript + Vite.
3. Configure Tailwind.
4. Configure Supabase.
5. Create database migration.
6. Enable RLS.
7. Create auth flow.
8. Create app layout and navigation.
9. Create reusable UI components.

## Phase 2 — Core Tracking

1. Wallet CRUD.
2. Default categories.
3. Transaction CRUD.
4. Transfer logic.
5. Wallet balance sync.
6. Transaction search and filters.
7. Empty states.

## Phase 3 — Decision Dashboard

1. Total balance.
2. Safe to Spend Today.
3. Upcoming bills.
4. 7-day forecast.
5. Money leak alert.
6. Goal progress.
7. Debt/paylater warning.
8. Advisor cards.

## Phase 4 — Planning

1. Budget CRUD.
2. Recurring bills/income.
3. Goals.
4. Debts/paylater.
5. 30-day forecast.
6. Cash runway.
7. Financial health score.

## Phase 5 — Insights

1. Income vs expense.
2. Spending by category.
3. Biggest leaks.
4. Top merchants.
5. Budget performance.
6. Debt summary.
7. Net worth summary.
8. Monthly review.

## Phase 6 — Polish

1. Dark mode.
2. PWA setup.
3. Loading skeletons.
4. Error handling.
5. Mobile scroll fixes.
6. Build check.
7. Code cleanup.

---

## Build Quality

Before finishing any major task:

1. Run build.
2. Fix TypeScript errors.
3. Fix console-breaking errors.
4. Check wallet balance sync.
5. Check transaction create/edit/delete.
6. Check transfer create/edit/delete.
7. Check income/expense reports exclude transfers.
8. Check Safe to Spend.
9. Check forecast.
10. Check mobile scroll.
11. Check RLS.
12. Summarize what changed and what still needs work.

---

## Final Acceptance Criteria

The MVP is acceptable only if:

1. App builds successfully.
2. User can sign up, log in, and log out.
3. User can complete or skip onboarding.
4. User can create wallets.
5. User can create income transactions.
6. User can create expense transactions.
7. User can create transfers.
8. Wallet balances stay correct.
9. Transfers do not double count.
10. User can edit and delete transactions safely.
11. User can create budget.
12. User can create recurring bills/income.
13. User can create goals.
14. User can create debts/paylater records.
15. Home shows useful financial answers.
16. Safe to Spend works.
17. Forecast works.
18. Advisor cards work.
19. Insight page explains spending patterns.
20. Mobile UI is usable.
21. Forms and modals scroll.
22. Supabase RLS is active.
23. Users cannot access other users’ data.
24. No fake data is inserted into production accounts.
25. UI feels simple, elegant, calm, and trustworthy.
26. Product addresses broad public financial problems.

---

## Important Warning

Do not overbuild advanced features before the MVP works.

The core must be correct first:

1. Transaction logic.
2. Balance sync.
3. Transfer handling.
4. Safe to Spend.
5. Forecast.
6. RLS.
7. Mobile usability.

A beautiful finance app with wrong balances is worse than useless. It is a decorative calculator of lies.
