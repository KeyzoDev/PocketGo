# PocketGo Design QA

- Source visual truth: attached PocketGo reference boards from June 25, 2026.
- Local app: `http://127.0.0.1:5174/`
- Viewport: 390 × 844 mobile.
- Evidence folder: `tmp/deep-research-dashboard-qa/`
- Captured states: splash, login, and research-driven decision Home dashboard.

## Research summary

- Launch/splash should stay lightweight and not behave like onboarding or a landing page; it should transition quickly into a usable first screen.
- Full-screen loading needs visible progress so users know the app is not frozen.
- Mobile login should reduce typing pain, keep form hierarchy clear, and provide clear alternatives.
- Google sign-in must use recognizable button text and the standard color Google mark.
- Finance-app readiness depends more on clarity and trust than decoration: show primary action, explain demo safely, avoid fake production data, and keep money decisions visible after login.
- Personal-finance Home should prioritize next decision and upcoming pressure before analytics. Charts explain history; Safe to Spend, commitments, forecast, debt, and goals help users decide what to do now.

## Add / remove / fix decisions

- Add: richer HD-feeling splash treatment, larger crisp 512px logo usage, premium lighting/depth, and subtle progress line.
- Add: official local Google `G` asset so the Google button feels production-ready.
- Add: short helper copy under Try Demo to reduce confusion about demo data.
- Add: decision-first Home stack: Safe to Spend, runway, reserved commitments, 7-day forecast, upcoming commitments, debt/paylater, goal progress, advisor, quick actions, spending chart, recent transactions.
- Remove: splash CTA behavior; splash remains loading-only.
- Move down: spending chart is no longer the first analytical object on Home, because users need forward-looking guidance first.
- Fix: demo exit/create-account route stays immediate and avoids auth-loading deadlock.
- Defer: broader dashboard IA changes, because transaction logic, RLS, and wallet sync must remain untouched in this pass.

## Findings

No actionable P0, P1, or P2 findings remain for the local build.

## Fidelity review

- Corrective scope includes app-readiness Home changes after research: premium splash/auth plus a decision-first dashboard using existing Safe to Spend, forecast, debt, goal, transaction, and recurring-rule logic.
- Visual system now follows the reference direction more closely: deep navy, lime, mint, white cards, light gray background, large rounded cards, stronger shadows, and floating rounded bottom navigation.
- Auth now starts with a finite HD/premium navy splash/loading screen only, then routes to the login card with email, Google, Apple Soon, Try Demo, signup, forgot password, and language access.
- Google login button calls Supabase OAuth with provider `google`, uses a local standard-color Google mark, and redirects to `/auth/callback`; OAuth users without profiles are covered by profile creation in cloud state load.
- Apple remains visible as a disabled/polished Coming Soon option.
- Demo mode uses session-local sample data only, shows a compact `Demo mode` pill with Create account and Exit actions, and does not write demo rows to Supabase.
- Exit demo routes back to login without stuck loading; Create account from demo exits demo and routes to signup without stuck loading.
- Main navigation is now Home, Accounts, Transactions, Budgets, More.
- Home follows the dashboard board structure: greeting, notification icon, navy total balance card, income/expense cards, spending donut, quick actions, recent transactions, and security alert.
- Home now answers the user’s practical questions first: safe daily spend, days until income, money reserved for commitments, 7-day risk, upcoming bills/debt, goal progress, and one advisor card.
- Accounts, Transactions, Budgets, Goals, Insights, and Settings are deferred for a later fidelity pass beyond the foundation.
- Transactions list rows now have stronger hierarchy for title, wallet/category text, amount color, and transaction icons.
- Google OAuth attempted the Supabase authorize URL in QA. External OAuth can still require provider/redirect dashboard verification for a complete real login.

## Functional evidence

- `npm run lint`: passed.
- `npm run test`: passed, 11 tests.
- `npm run build`: passed.
- Mobile Playwright QA via Google Chrome system executable: passed.
- Body width equals viewport width (`390px`); no horizontal overflow detected.
- Console errors: none on local app flow. External OAuth navigation produced provider/resource errors during Google attempt.
- Page errors: none.

## Screenshots

- `tmp/deep-research-dashboard-qa/01-splash.png`
- `tmp/deep-research-dashboard-qa/02-login.png`
- `tmp/deep-research-dashboard-qa/05-decision-home-final.png`

## Follow-up polish

- [P3] Budgets route still reuses the existing Plan implementation internally, with budget/goal/bill/debt sections grouped under the new nav label.
- [P3] Google code is connected to Supabase OAuth, but successful provider login depends on Supabase Google provider and redirect URL configuration.
- [P3] Apple remains disabled/Soon until provider support is intentionally enabled.
- [P3] Some reference-board screens are approximated with existing data models instead of new backend tables.

## Final result

final result: passed
