# PRD.md — PocketGo: Track Your Money

## 1. Product Identity

**Product Name:** PocketGo
**Tagline:** Track Your Money
**Full Name:** PocketGo: Track Your Money
**Category:** Personal Finance, Money Tracker, Budget Planner, Cashflow Forecaster, Debt & Goal Planner
**Primary Market:** Mass-market personal finance users, starting with Indonesia-friendly behavior but expandable globally
**Platform V1:** Responsive Web App / PWA
**Recommended Stack:** React + TypeScript + Vite + Tailwind CSS + Supabase
**Deployment Target:** Netlify

PocketGo is a simple, elegant, and practical personal finance app that helps people understand their money, control daily spending, prepare for upcoming bills, manage debt/paylater, build savings goals, and make better financial decisions.

PocketGo is not just an expense tracker.

PocketGo must answer the real questions people ask every day:

* How much money do I really have?
* How much is safe to spend today?
* Will I survive until payday?
* What bills are coming?
* Where is my money leaking?
* Am I spending too much on small purchases?
* Is my debt getting dangerous?
* Is my goal realistic?
* What should I do next?

The product must feel like a calm financial assistant, not a spreadsheet, not an accounting system, and not a guilt machine.

---

## 2. Product Vision

PocketGo exists to make personal finance understandable for ordinary people.

Most people do not wake up wanting “financial management software”. They want peace of mind. They want to know whether they can buy something today without ruining tomorrow. They want to avoid late bills, debt traps, forgotten subscriptions, and the classic mystery of money disappearing through tiny daily transactions.

PocketGo should become the daily financial home screen for people who want clarity.

The long-term vision:

> PocketGo helps people track money, plan ahead, avoid financial surprises, and make better money decisions every day.

---

## 3. Product Thesis

The future of money tracker apps is not manual expense logging.

The future is decision support.

A traditional tracker says:

> “You spent Rp1.200.000 on food this month.”

PocketGo should say:

> “Food spending is rising. If you keep this pace, the category will run out in 6 days. Keep daily food spending below Rp42.000 to stay safe.”

A traditional tracker says:

> “Your balance is Rp2.000.000.”

PocketGo should say:

> “Your balance is Rp2.000.000, but only Rp430.000 is safe to spend because bills and debt payments are coming.”

A traditional tracker says:

> “You have 5 subscriptions.”

PocketGo should say:

> “Your subscriptions cost Rp315.000/month. Cancelling one unused subscription could move your emergency fund goal 1 month faster.”

PocketGo must turn raw financial data into clear next actions.

---

## 4. Research-Backed Problem Landscape

PocketGo is designed for broad financial problems faced by many people, not one specific user.

### 4.1 People Have Access to Financial Tools, But Not Always Understanding

Many people already use banks, e-wallets, QR payments, credit, paylater, and digital financial services. But access does not automatically mean control.

PocketGo must bridge the gap between financial inclusion and financial understanding.

The app must be easy enough for users with low financial literacy and powerful enough for users who want advanced planning.

---

### 4.2 Digital Payments Make Spending Easier, But Tracking Harder

Cash used to be physically visible. Digital payments are invisible, instant, and fragmented.

People may spend through:

* Cash
* Bank transfer
* Debit card
* Credit card
* QR payment
* E-wallet
* Paylater
* Marketplace balance
* Subscription auto-debit
* Family transfers
* Business wallets

This creates a fragmented money reality.

PocketGo must unify this into one clear view.

---

### 4.3 Small Transactions Become Big Leaks

The most dangerous spending is not always one large purchase.

It is often:

* Coffee
* Snacks
* Delivery food
* QRIS purchases
* Marketplace impulse buys
* Transport
* Small subscriptions
* Daily convenience spending
* Micro top-ups
* Game/app purchases

PocketGo must detect small leaks and show them in a way that feels helpful, not judgmental.

---

### 4.4 Paylater and Consumer Debt Need Clear Visibility

Paylater feels small at checkout but becomes heavy when many small installments stack together.

Users need to know:

* Total active debt
* Total monthly installment
* Due dates
* Remaining tenor
* Debt-to-income ratio
* Whether adding another installment is safe
* What happens if they miss payment
* Which debt should be prioritized

PocketGo must make debt visible before it becomes a crisis.

---

### 4.5 Most Budgeting Systems Fail Because They Are Too Rigid

Many people cannot follow a strict budget because life is irregular.

Problems include:

* Income is not always stable.
* Unexpected expenses happen.
* Family requests happen.
* Medical costs happen.
* School costs happen.
* Bills are not always monthly.
* Freelancers do not have predictable payday.
* People forget to input transactions.
* Budget categories are too complicated.

PocketGo must support flexible budgeting.

The app should help users adjust, not make them feel like they failed.

---

### 4.6 People Need Planning, Not Just Reports

Reports explain the past.

Planning protects the future.

PocketGo must help users plan:

* Until next payday
* Until end of month
* Emergency fund
* Debt payoff
* House
* Vehicle
* Education
* Wedding
* Child expenses
* Vacation
* Business capital
* Retirement preparation
* Irregular yearly expenses

PocketGo must make future financial pressure visible today.

---

### 4.7 Money Is Emotional

Money creates stress, shame, fear, confidence, security, and relationship conflict.

PocketGo must avoid harsh judgment.

Bad copy:

> “You are overspending.”

Better copy:

> “This category is running faster than planned. Reduce spending by around Rp35.000/day to stay safe.”

Bad copy:

> “You failed your budget.”

Better copy:

> “Budget exceeded. You can rebalance from another category or adjust the plan.”

Tone matters.

PocketGo must feel like a calm assistant, not an angry accountant trapped in a phone.

---

## 5. Target Users

PocketGo is for many types of users.

The app must not be built only for people with one simple monthly salary.

---

### 5.1 Beginner Money Tracker

People who are just starting to manage money.

They often say:

* “I do not know where my money goes.”
* “I want to start tracking but apps feel complicated.”
* “I need something simple.”
* “I do not want a spreadsheet.”
* “I only need to know income, expense, and balance.”

Core needs:

* Fast transaction input
* Simple categories
* Clear balance
* Simple reports
* Helpful empty states
* No intimidating finance terms

---

### 5.2 Paycheck-to-Paycheck Worker

People who need to survive until payday.

They often say:

* “Can I spend today?”
* “Will my money last until salary day?”
* “Why is my balance always low before payday?”
* “What bills are coming before my next income?”

Core needs:

* Safe to Spend Today
* Payday countdown
* Upcoming bills
* Forecast until next income
* Daily spending limit
* Warning before balance gets dangerous

---

### 5.3 Family and Household Manager

People managing household expenses.

They often say:

* “Household spending is messy.”
* “I need to know who paid what.”
* “My partner and I need shared visibility.”
* “Transfers between family members should not be counted as expenses.”
* “We need a shared goal.”

Core needs:

* Shared household mode
* Personal and shared wallets
* Household budget
* Family transfers
* Shared bills
* Shared goals
* Monthly household review

V1 can prepare the data model for household mode, but full multi-user collaboration can be V2.

---

### 5.4 Freelancer and Irregular-Income User

People with unstable income.

They often say:

* “My income is different every month.”
* “I need to know my average income.”
* “I do not know how much I can safely spend.”
* “Some months are good, some months are scary.”

Core needs:

* Irregular income support
* Average monthly income
* Minimum survival budget
* Cash runway
* Low-income month warning
* Emergency reserve planning
* Flexible budget mode

---

### 5.5 Student and Young Adult

People learning money habits.

They often say:

* “My money disappears from small purchases.”
* “I use e-wallet and QR payments a lot.”
* “I want to save but always fail.”
* “I need simple guidance.”

Core needs:

* Simple mode
* Small-spending leak detector
* Savings goal
* Low-balance warning
* Gamified but not childish progress
* Friendly financial education microcopy

---

### 5.6 Debt and Paylater User

People with installments, credit cards, personal loans, or BNPL.

They often say:

* “I forgot my due date.”
* “I have too many small installments.”
* “I do not know total monthly debt.”
* “Can I take another installment?”
* “Which debt should I pay first?”

Core needs:

* Debt dashboard
* Paylater tracker
* Due date calendar
* Debt-to-income ratio
* Minimum payment tracker
* Installment simulation
* Debt payoff strategy

---

### 5.7 Small Business / Side Hustle User

People with simple business income.

They often say:

* “Business money and personal money are mixed.”
* “I do not know if my small business is profitable.”
* “I need to separate operational expenses.”
* “I need simple cashflow, not accounting software.”

Core needs:

* Personal/business wallet separation
* Business income and expense categories
* Simple profit summary
* Operational cost tracking
* Owner transfer tracking
* Cashflow by wallet

V1 should support business wallets and categories, while full business mode can be V2.

---

### 5.8 Underbanked / Cash-Heavy User

People who still rely heavily on cash or informal finance.

They often say:

* “I mostly use cash.”
* “I do not want to connect my bank.”
* “I need manual tracking.”
* “I want privacy.”
* “My transactions are not all digital.”

Core needs:

* Strong manual entry
* Offline-friendly design direction
* Cash wallet
* Simple daily log
* Trust and privacy
* No forced bank sync

---

## 6. Product Positioning

PocketGo should be positioned as:

> A simple money tracker that tells you what is safe, what is risky, and what to do next.

Not:

> A complex accounting app.

Not:

> A pure budgeting spreadsheet.

Not:

> An investment app.

Not:

> A bank sync dashboard only.

Not:

> A guilt-based spending police.

---

## 7. Core Product Promise

PocketGo promises five things:

1. Track money quickly.
2. Show true available money.
3. Warn before problems happen.
4. Help users plan realistic goals.
5. Turn financial data into clear daily actions.

---

## 8. Product Principles

### 8.1 Decision First, Data Second

The app should answer the user’s situation first.

Home should not start with complicated charts.

Home should show:

* Safe to Spend Today
* Total usable balance
* Upcoming bills
* Forecast risk
* Money leaks
* Goal status
* Suggested next action

Charts belong in Insight, not all over Home like a financial crime scene.

---

### 8.2 Three-Second Transaction Input

Transaction input must be fast.

Primary flow:

> Amount → Category → Wallet → Save

Optional fields:

* Date
* Merchant
* Note
* Tags
* Attachment
* Recurring
* Split
* Location

Never force optional fields.

If transaction entry feels like paperwork, users will quit.

---

### 8.3 Manual First, Automation Ready

V1 should work perfectly with manual input.

Future versions can add:

* Bank sync
* E-wallet sync
* CSV import
* OCR receipt
* Screenshot parsing
* AI categorization
* Subscription detection

But the foundation must not depend on bank sync.

Manual-first is important because:

* Not all users trust sync.
* Not all users have compatible banks.
* Many users use cash.
* Sync can break.
* Privacy matters.

---

### 8.4 Forecast Before Failure

PocketGo should not wait until the user runs out of money.

It should detect future problems early.

Examples:

* “Balance may go below Rp0 on the 24th.”
* “Your next bill is due in 3 days.”
* “At this pace, food budget runs out next week.”
* “You need Rp500.000 more to safely reach payday.”

---

### 8.5 Flexible Budgeting

People do not live in perfect budget spreadsheets.

PocketGo must allow:

* Rebalancing
* Category rollover
* Emergency override
* Irregular income
* Payday-based budget
* Weekly budget
* Monthly budget
* Simple mode
* Advanced mode

The app should help users recover after overspending.

---

### 8.6 Local Behavior, Global Logic

PocketGo should support Indonesia-friendly patterns but keep the logic globally usable.

Indonesia-friendly examples:

* QRIS
* E-wallet
* Paylater
* Bank transfer
* Cash
* Family support
* Arisan
* Kontrakan
* Pulsa/data
* Delivery food
* Marketplace shopping
* Small business income

Global logic:

* Cashflow
* Budgeting
* Bills
* Debt
* Goals
* Savings
* Forecast
* Net worth
* Household finance

---

### 8.7 Privacy by Design

Finance data is sensitive.

PocketGo must be built with trust.

Required principles:

* User owns their data.
* No fake data in real accounts.
* No unnecessary data collection.
* Clear privacy settings.
* Export data.
* Delete data.
* Supabase RLS enabled.
* No access to other users’ data.
* Bank sync is optional in the future, never forced.

---

### 8.8 Calm, Not Judgmental

PocketGo should reduce stress.

Avoid shaming copy.

Use helpful copy.

Examples:

* “This category is getting tight.”
* “You can still recover this budget.”
* “Try limiting daily spending to Rp40.000.”
* “This goal needs a higher monthly contribution.”
* “A new installment may make next month risky.”

---

## 9. Key Differentiators

### 9.1 Safe to Spend Today

Most people do not need to know only their balance.

They need to know what part of the balance is actually safe.

Safe to Spend considers:

* Wallet balance
* Upcoming bills
* Recurring expenses
* Debt payments
* Subscription renewals
* Goal commitments
* Emergency buffer
* Days until next income

Output:

> “You can safely spend around Rp75.000 today.”

or

> “Be careful. Your safe money today is only Rp22.000.”

or

> “Risky. Upcoming bills are higher than your available balance.”

---

### 9.2 Cash Runway

For irregular-income users and small business users, PocketGo should estimate how long money can last.

Output examples:

* “Your money can cover around 18 days of normal spending.”
* “At current spending pace, cash may run out before next expected income.”
* “Your minimum survival budget is Rp2.100.000/month.”

---

### 9.3 Money Leak Detection

PocketGo should detect silent leaks.

Leak types:

* Small frequent transactions
* Category acceleration
* Merchant repetition
* Unused subscriptions
* Paylater stacking
* Weekend spending spikes
* Delivery food increase
* Marketplace impulse purchases
* Cash withdrawal with no follow-up tracking

Output examples:

* “Small purchases under Rp30.000 reached Rp480.000 this month.”
* “Delivery food spending is 32% higher than last month.”
* “You have 4 active subscriptions totaling Rp315.000/month.”

---

### 9.4 Debt & Paylater Radar

PocketGo must help users avoid hidden debt pressure.

Debt radar includes:

* Total remaining debt
* Monthly installment burden
* Due dates
* Debt-to-income ratio
* Missed payment risk
* New installment simulation
* Payoff progress

Output:

> “Your monthly debt payment is 38% of recorded income. Avoid adding new installments.”

---

### 9.5 Goal Reality Check

PocketGo should not just show progress bars.

It should tell users whether goals are realistic.

Example:

> “To reach this goal by December, you need to save Rp850.000/month. Your current average is Rp420.000/month.”

Goal status:

* On track
* Slightly behind
* At risk
* Unrealistic
* Completed

---

### 9.6 Household Clarity

Many financial problems happen because household money is not clearly separated.

PocketGo should eventually support:

* Personal wallets
* Shared wallets
* Shared bills
* Shared goals
* Family transfers
* Household monthly review
* Partner review
* “Who paid?” tracking

V1 should prepare data structure for this, even if full collaboration is V2.

---

## 10. Core Features

## 10.1 Authentication

Required:

* Sign up
* Login
* Logout
* Forgot password
* Profile creation after sign up
* Protected routes

Profile fields:

* Full name
* Currency
* Default budget start day
* Default income pattern
* Theme
* Onboarding status

Acceptance criteria:

* User can create account.
* User can log in and out.
* User cannot access private pages without login.
* User only sees their own data.

---

## 10.2 Onboarding

Purpose:

Help users start without confusion.

Onboarding must not feel like tax paperwork wearing makeup.

Steps:

1. Welcome to PocketGo.
2. Choose primary need:

   * Know where money goes
   * Survive until payday
   * Control daily spending
   * Manage bills
   * Pay debt/paylater
   * Build emergency fund
   * Save for a goal
   * Manage family money
   * Manage side business
3. Choose income pattern:

   * Monthly
   * Twice a month
   * Weekly
   * Daily
   * Irregular
   * No stable income yet
4. Create first wallet:

   * Cash
   * Bank
   * E-wallet
   * Credit card
   * Paylater
   * Savings
   * Business
5. Input starting balance.
6. Add upcoming bill optional.
7. Add first goal optional.
8. Finish.

Rules:

* User can skip.
* Skipping does not break app.
* Empty states guide user after skip.
* Do not insert fake transactions into production accounts.

---

## 10.3 Wallets

Wallet types:

* Cash
* Bank
* E-wallet
* Credit card
* Paylater
* Savings
* Investment
* Business
* Loan
* Other

Wallet fields:

* Name
* Type
* Current balance
* Starting balance
* Currency
* Icon
* Color
* Include in total
* Archived status
* Sort order

Rules:

* Income increases wallet balance.
* Expense decreases wallet balance.
* Transfer moves balance between wallets.
* Credit card and paylater require special handling in future versions.
* Archived wallets are hidden from main inputs but historical data remains.

Acceptance criteria:

* User can create, edit, archive wallets.
* Total balance only includes selected active wallets.
* Wallet balance stays correct after transaction changes.

---

## 10.4 Categories

Default categories should be broad, practical, and editable.

Expense categories:

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

Income categories:

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

Rules:

* User can add, edit, archive categories.
* Used categories cannot be hard deleted.
* Archived categories remain visible in old transactions.
* Categories support local naming in the UI.

---

## 10.5 Transactions

Transaction types:

* income
* expense
* transfer_out
* transfer_in
* adjustment

Main transaction fields:

* Type
* Amount
* Wallet
* Category
* Date
* Merchant
* Note
* Tags
* Attachment
* Recurring link
* Transfer group ID
* Related wallet ID

Rules:

* Amount is always positive.
* Type controls balance effect.
* Income increases wallet.
* Expense decreases wallet.
* Transfer creates two linked rows.
* Transfer is excluded from income and expense analytics.
* Adjustment corrects balance.
* Editing must reverse old effect and apply new effect.
* Deleting must reverse balance effect.
* Transfer edit/delete must update both linked rows.

Acceptance criteria:

* User can add transaction quickly.
* User can edit and delete.
* Balance remains correct.
* Transfer never double counts.
* Transactions can be filtered and searched.

---

## 10.6 Quick Add

Quick Add is critical.

Required UX:

* Amount first
* Big numeric input
* Type switch: Expense / Income / Transfer
* Category chips
* Wallet selector
* Save button always visible
* Optional fields collapsed
* Recent categories
* Recent merchants
* Save and add another optional

Goal:

> A normal expense should be saved in under 3 seconds.

---

## 10.7 Budgeting

Budget modes:

### V1

* Monthly category budget
* Overall monthly spending limit
* Simple budget mode

### V2

* Envelope budget
* Zero-based budget
* Payday budget
* Weekly budget
* Rollover budget
* Irregular-income budget

Budget fields:

* Period
* Category
* Planned amount
* Actual amount
* Remaining
* Status

Budget status:

* Safe
* Watch
* Tight
* Exceeded

Budget copy examples:

* “Still safe.”
* “Getting tight.”
* “Limit nearly reached.”
* “Exceeded, but recoverable.”

Budget recovery suggestions:

* Reduce daily spending
* Rebalance from other category
* Adjust budget
* Move goal contribution
* Mark as emergency

---

## 10.8 Recurring Bills and Income

Recurring types:

* Income
* Expense
* Transfer
* Debt payment
* Subscription

Frequency:

* Daily
* Weekly
* Monthly
* Yearly
* Custom

Fields:

* Name
* Type
* Amount
* Wallet
* Category
* Frequency
* Start date
* End date
* Next due date
* Reminder days before
* Auto-post status
* Merchant
* Note

Rules:

* Recurring items appear in upcoming bills.
* Forecast includes recurring items.
* User can mark as paid.
* Mark as paid creates a transaction.
* Auto-post can be implemented later.

Acceptance criteria:

* User sees upcoming payments.
* User can avoid forgotten bills.
* Forecast reflects upcoming obligations.

---

## 10.9 Debt and Paylater

Debt types:

* Credit card
* Paylater
* Personal loan
* Installment
* Mortgage
* Vehicle loan
* Student loan
* Informal loan
* Other

Fields:

* Name
* Lender
* Original amount
* Remaining balance
* Interest rate optional
* Installment amount
* Minimum payment
* Due day
* Start date
* End date
* Linked wallet
* Status

Features:

* Total debt
* Total monthly payment
* Due date list
* Remaining balance
* Debt-to-income ratio
* Debt warning
* Payment history
* New installment simulation in future version

Debt statuses:

* Healthy
* Watch
* Heavy
* Risky

Copy examples:

* “Debt payment is manageable.”
* “Debt payment is getting high compared to income.”
* “Avoid taking new installments this month.”
* “This payment is due in 3 days.”

---

## 10.10 Goals

Goal types:

* Emergency fund
* House
* Vehicle
* Vacation
* Education
* Wedding
* Child expenses
* Business capital
* Debt free
* Retirement
* Custom

Fields:

* Name
* Target amount
* Current amount
* Target date
* Monthly contribution
* Linked wallet optional
* Priority
* Status

Goal calculations:

* Required monthly saving
* Estimated completion date
* Progress percentage
* On-track status
* Gap amount

Goal statuses:

* On track
* Slightly behind
* At risk
* Unrealistic
* Completed

Goal copy:

* “On track.”
* “Need Rp350.000 more per month.”
* “At current pace, this goal may finish 4 months late.”
* “Try lowering target or extending timeline.”

---

## 10.11 Safe to Spend Today

Safe to Spend is a core PocketGo feature.

Purpose:

Show how much money the user can safely spend today without hurting bills, debt payments, goals, and basic needs.

Inputs:

* Active included wallet balance
* Upcoming bills
* Recurring expenses
* Subscriptions
* Debt payments
* Goal contributions
* Emergency buffer
* Days until next income or end of month
* Average daily variable spending optional

Formula:

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

If next income is unknown:

```txt
days_until_next_income = days until end of month
```

Status:

* Safe
* Caution
* Danger

Output examples:

* “Safe. You can spend around Rp85.000 today.”
* “Careful. Safe money today is only Rp35.000.”
* “Risky. Upcoming bills are higher than available balance.”

---

## 10.12 Cashflow Forecast

Forecast periods:

* 7 days
* 30 days
* Custom future period in V2

Inputs:

* Current balance
* Recurring income
* Recurring expense
* Subscriptions
* Debt payments
* Planned goal contributions
* Average daily spending optional

Outputs:

* Daily projected balance
* Lowest balance
* Danger dates
* Caution dates
* Summary text

Forecast copy:

* “Cashflow looks safe for the next 7 days.”
* “Balance may drop below Rp0 on 24 July.”
* “Lowest projected balance is Rp180.000.”
* “Reduce daily spending by Rp25.000 to stay safe.”

---

## 10.13 Money Leak Detection

Leak detection identifies hidden spending patterns.

Leak types:

1. Small transaction accumulation.
2. Category acceleration.
3. Repeated merchant.
4. Unused subscriptions.
5. Paylater stacking.
6. Weekend spending spikes.
7. Delivery food increase.
8. Cash withdrawals without category tracking.
9. Fees/admin charges.
10. Shopping impulse pattern.

Example rules:

* If small transactions under threshold exceed X% of monthly spending, show leak.
* If category spending is 25% higher than previous month, show alert.
* If same merchant appears more than N times this month, show insight.
* If subscriptions exceed X% of income, show subscription warning.
* If debt payment exceeds X% of income, show debt warning.

Copy examples:

* “Small purchases under Rp30.000 reached Rp480.000 this month.”
* “Shopping spending is rising faster than planned.”
* “You paid this merchant 9 times this month.”
* “Subscription spending is getting high.”

---

## 10.14 Financial Health Score

V1 can implement a simple score.

Score: 0–100

Components:

* Cashflow health: 20
* Emergency fund readiness: 20
* Debt pressure: 20
* Budget consistency: 15
* Savings consistency: 15
* Leak control: 10

Labels:

* 0–39: Critical
* 40–59: Needs attention
* 60–74: Improving
* 75–89: Healthy
* 90–100: Excellent

Score must always include actions.

Bad:

> “Score: 54”

Good:

> “Score: 54. Improve it by reducing debt pressure, building emergency savings, and lowering small recurring spending.”

---

## 10.15 Advisor Cards

Advisor cards are rule-based in V1.

Card fields:

* Title
* Body
* Action text
* Severity
* Source
* Dismissed status

Severity:

* info
* success
* warning
* danger

Rules:

* Budget almost exceeded
* Budget exceeded
* Bill due soon
* Debt due soon
* Forecast balance below zero
* Spending increased from previous month
* Subscription total high
* No emergency fund goal
* Goal behind schedule
* Safe to Spend low
* Cash runway low
* Income lower than usual
* Repeated small transactions

Advisor tone:

* Calm
* Practical
* Specific
* Non-judgmental
* Short

Examples:

Title:

> “Food spending is getting tight”

Body:

> “You have Rp180.000 left for 6 days.”

Action:

> “Keep food spending below Rp30.000/day.”

---

## 11. Main Navigation

Use 5 main areas:

1. Home
2. Transactions
3. Plan
4. Insight
5. More

Mobile:

* Bottom navigation
* Floating add transaction button

Desktop:

* Sidebar navigation
* Main content area
* Optional right summary panel

---

## 12. Pages

## 12.1 Home

Home is the most important page.

Purpose:

Give instant financial clarity.

Sections:

1. Greeting
2. Total balance
3. Safe to Spend Today
4. Cash runway / payday countdown
5. 7-day forecast chart
6. Upcoming bills
7. Money leak alert
8. Goal progress
9. Debt/paylater warning
10. Advisor cards
11. Quick add button

Home must answer:

* Am I safe?
* How much can I spend today?
* What is coming soon?
* What is leaking?
* What should I do next?

---

## 12.2 Transactions

Purpose:

Let users record and review money movement.

Features:

* Group by date
* Search
* Filter by type
* Filter by wallet
* Filter by category
* Filter by date
* Add transaction
* Edit transaction
* Delete transaction
* Transfer display
* Empty state

---

## 12.3 Add Transaction

Modes:

* Expense
* Income
* Transfer
* Adjustment

Expense/income required fields:

* Amount
* Wallet
* Category
* Date

Optional fields:

* Merchant
* Note
* Tags
* Attachment
* Recurring

Transfer required fields:

* Amount
* From wallet
* To wallet
* Date

Rules:

* Same wallet transfer is not allowed.
* Amount must be positive.
* Wallet must exist.
* Category required for income/expense.
* Transfer creates two linked rows.

---

## 12.4 Plan

Purpose:

Help users prepare for the future.

Sections:

1. Monthly budget
2. Cashflow forecast
3. Bills and recurring
4. Goals
5. Debt and paylater
6. What-if simulator teaser

Questions Plan must answer:

* Is this month safe?
* What bills are coming?
* Are my goals on track?
* Is my debt level safe?
* What happens if I spend more?

---

## 12.5 Insight

Purpose:

Show patterns and learning.

Sections:

1. Month selector
2. Income vs expense
3. Spending by category
4. Biggest leaks
5. Top merchants
6. Budget performance
7. Net worth summary
8. Debt summary
9. Financial health score
10. Advisor summary

Charts must be clean and limited.

Insight should explain the meaning of data.

---

## 12.6 More

Sections:

* Wallets
* Categories
* Recurring
* Goals
* Debts
* Assets
* Import/export
* Settings
* Privacy
* About PocketGo

---

## 13. Data Model

Use Supabase PostgreSQL.

All user-owned tables must include:

* id
* user_id
* created_at
* updated_at

Enable Row Level Security on all user-owned tables.

Recommended tables:

1. profiles
2. wallets
3. categories
4. transactions
5. budgets
6. budget_items
7. recurring_rules
8. goals
9. goal_contributions
10. debts
11. debt_payments
12. subscriptions
13. assets
14. advisor_cards
15. monthly_snapshots
16. households
17. household_members

V1 may create household tables but does not need full household collaboration UI.

---

## 13.1 profiles

Fields:

* id
* full_name
* currency
* budget_start_day
* default_income_day
* income_pattern
* theme
* onboarding_completed
* created_at
* updated_at

---

## 13.2 wallets

Fields:

* id
* user_id
* household_id nullable
* name
* type
* balance
* starting_balance
* currency
* icon
* color
* include_in_total
* is_archived
* sort_order
* created_at
* updated_at

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

---

## 13.3 categories

Fields:

* id
* user_id
* name
* type
* parent_id
* icon
* color
* is_default
* is_archived
* sort_order
* created_at
* updated_at

Category types:

* income
* expense
* transfer
* system

---

## 13.4 transactions

Fields:

* id
* user_id
* household_id nullable
* wallet_id
* category_id
* type
* amount
* transaction_date
* merchant
* note
* tags
* attachment_url
* transfer_group_id
* related_wallet_id
* recurring_rule_id
* is_recurring_generated
* created_at
* updated_at

Transaction types:

* income
* expense
* transfer_out
* transfer_in
* adjustment

---

## 13.5 budgets

Fields:

* id
* user_id
* household_id nullable
* name
* period_start
* period_end
* total_limit
* mode
* rollover
* created_at
* updated_at

Budget modes:

* simple
* category
* envelope
* zero_based
* paycheck

---

## 13.6 budget_items

Fields:

* id
* user_id
* budget_id
* category_id
* planned_amount
* created_at
* updated_at

---

## 13.7 recurring_rules

Fields:

* id
* user_id
* household_id nullable
* name
* type
* amount
* wallet_id
* category_id
* frequency
* interval_count
* start_date
* end_date
* next_due_date
* auto_post
* reminder_days_before
* status
* merchant
* note
* created_at
* updated_at

---

## 13.8 goals

Fields:

* id
* user_id
* household_id nullable
* name
* type
* target_amount
* current_amount
* target_date
* monthly_contribution
* linked_wallet_id
* priority
* status
* created_at
* updated_at

---

## 13.9 debts

Fields:

* id
* user_id
* household_id nullable
* name
* type
* lender
* original_amount
* remaining_balance
* interest_rate
* installment_amount
* minimum_payment
* due_day
* start_date
* end_date
* linked_wallet_id
* status
* created_at
* updated_at

---

## 13.10 subscriptions

Fields:

* id
* user_id
* household_id nullable
* name
* amount
* wallet_id
* category_id
* billing_cycle
* next_billing_date
* status
* merchant
* note
* created_at
* updated_at

---

## 13.11 assets

Fields:

* id
* user_id
* household_id nullable
* name
* type
* value
* acquisition_value
* linked_wallet_id
* include_in_net_worth
* note
* created_at
* updated_at

---

## 13.12 households

Fields:

* id
* owner_user_id
* name
* currency
* created_at
* updated_at

Purpose:

Prepare for future family/shared finance mode.

---

## 13.13 household_members

Fields:

* id
* household_id
* user_id
* role
* status
* created_at
* updated_at

Roles:

* owner
* admin
* member
* viewer

Status:

* invited
* active
* removed

---

## 14. RLS Requirements

Enable RLS on all user-owned tables.

For profiles:

* id = auth.uid()

For user-owned rows:

* user_id = auth.uid()

For future household rows:

* user can access row if user is active member of household_id

V1 can keep household policies simple or defer household access until V2.

Never allow users to access other users’ personal data.

---

## 15. Core Calculations

## 15.1 Total Balance

```txt
total_balance =
sum(wallet.balance where include_in_total = true and is_archived = false)
```

---

## 15.2 Monthly Income

```txt
monthly_income =
sum(transactions.amount where type = income and date is inside selected month)
```

---

## 15.3 Monthly Expense

```txt
monthly_expense =
sum(transactions.amount where type = expense and date is inside selected month)
```

Exclude:

* transfer_in
* transfer_out
* adjustment

---

## 15.4 Net Cashflow

```txt
net_cashflow = monthly_income - monthly_expense
```

---

## 15.5 Savings Rate

```txt
savings_rate =
(monthly_income - monthly_expense) / monthly_income * 100
```

If income is zero, return null.

---

## 15.6 Debt-to-Income Ratio

```txt
debt_to_income_ratio =
monthly_debt_payments / monthly_income * 100
```

If income is zero, show “income unknown” instead of crashing.

---

## 15.7 Cash Runway

```txt
cash_runway_days =
available_balance / average_daily_expense
```

If average_daily_expense is zero, show “not enough data”.

---

## 15.8 Safe to Spend

```txt
safe_to_spend_total =
available_balance
- required_until_next_income
- goal_commitments
- emergency_buffer

safe_to_spend_today =
safe_to_spend_total / days_until_next_income
```

If no next income date is known, use days until end of month.

---

## 16. UI Direction

PocketGo must feel:

* Simple
* Elegant
* Calm
* Trustworthy
* Practical
* Mobile-first
* Premium but not intimidating

Avoid:

* Spreadsheet-like interface
* Accounting software style
* Too many colors
* Too many charts
* Too much text
* Overly gamified UI
* Harsh warnings
* Confusing finance jargon

Use:

* Rounded cards
* Soft shadows
* Clear typography
* Minimal icons
* Calm colors
* Helpful empty states
* Smooth subtle animation
* Large tap targets
* Clean charts

Suggested fonts:

* Inter
* Plus Jakarta Sans
* Geist
* Manrope

Light mode:

* Background: warm off-white
* Card: white
* Primary: deep blue, emerald, or teal
* Text: near black
* Muted: gray
* Success: green
* Warning: amber
* Danger: red

Dark mode:

* Background: deep navy / charcoal
* Card: slightly lighter navy
* Primary: mint / blue
* Text: soft white
* Muted: gray-blue

---

## 17. UX Copy Principles

Copy must be:

* Short
* Clear
* Helpful
* Specific
* Non-judgmental
* Action-oriented

Good copy:

* “Safe until payday.”
* “Safe money today.”
* “This category is getting tight.”
* “Upcoming bill in 3 days.”
* “Small purchases are adding up.”
* “This goal needs a higher monthly saving.”
* “Try reducing daily spending by Rp25.000.”

Bad copy:

* “You are bad with money.”
* “You overspent again.”
* “Budget failed.”
* “You cannot afford this.”
* “Your finances are a mess.”

---

## 18. Empty States

Every empty state must guide the user.

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

## 19. PWA and Mobile Requirements

PocketGo must work well on mobile.

Requirements:

* Bottom navigation on mobile
* Sidebar on desktop
* Floating add button
* Forms must scroll
* Modals and sheets must scroll
* Bottom nav must not cover submit buttons
* Use safe-area padding
* Avoid fixed heights that block scrolling
* Large tap targets
* Numeric keyboard for amount input
* Clear loading and error states

PWA:

* manifest.json
* app name PocketGo
* short name PocketGo
* theme color
* icon placeholder
* installable basics

---

## 20. Development Priorities

## P0 — Foundation

1. React + TypeScript + Vite setup
2. Tailwind setup
3. Supabase setup
4. Auth
5. Database schema
6. RLS policies
7. App shell
8. Navigation
9. UI components
10. Responsive layout

---

## P1 — Core Tracking

1. Wallet CRUD
2. Default categories
3. Transaction CRUD
4. Transfer logic
5. Balance sync
6. Transaction filters
7. Empty states

---

## P2 — Decision Dashboard

1. Total balance
2. Safe to Spend Today
3. Upcoming bills
4. 7-day forecast
5. Money leak alert
6. Goal progress
7. Debt warning
8. Advisor cards

---

## P3 — Planning

1. Monthly budget
2. Recurring bills/income
3. Goals
4. Debts/paylater
5. 30-day forecast
6. Cash runway
7. Financial health score

---

## P4 — Insights

1. Income vs expense
2. Spending by category
3. Biggest leaks
4. Top merchants
5. Budget performance
6. Debt summary
7. Net worth summary
8. Monthly review

---

## P5 — Polish

1. Dark mode
2. PWA
3. Loading skeletons
4. Better empty states
5. Mobile scroll fixes
6. Error handling
7. Build checks
8. Code cleanup

---

## 21. V1 Acceptance Criteria

PocketGo MVP is acceptable when:

1. App builds successfully.
2. App has no console-breaking errors.
3. User can sign up, log in, and log out.
4. User can complete or skip onboarding.
5. User can create wallets.
6. User can create income transactions.
7. User can create expense transactions.
8. User can create transfers.
9. Transfer creates linked rows.
10. Transfers are not counted as income or expense.
11. Wallet balance updates correctly.
12. Editing a transaction keeps balance correct.
13. Deleting a transaction keeps balance correct.
14. User can create budgets.
15. User can create recurring bills/income.
16. User can create goals.
17. User can create debts/paylater records.
18. Home shows total balance.
19. Home shows Safe to Spend Today.
20. Home shows upcoming bills.
21. Home shows 7-day forecast.
22. Home shows advisor cards.
23. Home shows goal progress.
24. Plan shows budget, forecast, goals, bills, and debts.
25. Insight shows income, expense, categories, leaks, and summary.
26. More shows wallets, categories, recurring, goals, debts, assets, settings.
27. App is responsive on mobile.
28. Forms and modals scroll properly.
29. Supabase RLS is enabled.
30. User cannot access other users’ data.
31. No fake data is inserted into real production accounts.
32. UI feels simple, elegant, calm, and trustworthy.
33. Product is built for broad public financial problems, not one person’s personal finance case.

---

## 22. Future Roadmap

## V2

* Household/couple collaboration
* CSV import/export
* OCR receipt
* Screenshot transaction parsing
* Smart category detection
* Subscription detection
* Push reminders
* What-if simulator
* Debt payoff strategy
* Monthly PDF report
* Multi-language support

## V3

* Bank sync
* E-wallet sync
* Open finance integration
* AI financial advisor
* Business mode
* Shared approval flow
* Advanced forecasting
* Mobile app via Capacitor
* Financial education journeys
* Privacy dashboard

---

## 23. Product North Star

The North Star is not number of transactions entered.

The North Star is:

> Number of users who understand what is safe to spend and take one better financial action.

Supporting metrics:

* Weekly active users
* Transactions logged per active user
* Safe-to-spend views
* Bills marked as paid
* Goals created
* Debt records created
* Forecast warnings viewed
* Advisor actions clicked
* Users with improved financial health score
* Users returning after 4 weeks

---

## 24. Final Product Doctrine

PocketGo must not become a pile of features.

PocketGo must remain focused on clarity.

The core loop:

1. User records or imports money activity.
2. PocketGo organizes it.
3. PocketGo predicts what happens next.
4. PocketGo warns about risks.
5. PocketGo suggests practical actions.
6. User feels more in control.

If a feature does not improve clarity, control, planning, or trust, do not prioritize it.
