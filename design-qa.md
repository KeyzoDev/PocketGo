# PocketGo Design QA

- Source visual truth: attached PocketGo reference boards from June 25, 2026.
- Local app: `http://127.0.0.1:5174/`
- Viewport: 390 × 844 mobile.
- Evidence folder: `tmp/focused-auth-demo-polish-qa/`
- Captured states: splash, login, default USD demo Home, demo signup handoff, and Indonesian/IDR demo Home.

## Final mobile visual QA — all main tabs

- Date: 2026-07-01
- Local app: `http://127.0.0.1:5174/`
- Viewport: 390 × 844 mobile.
- Evidence folder: `tmp/final-mobile-visual-qa-2026-07-01/`

### Fixes applied

- Transactions filter row no longer allows the wallet selector to extend beyond the mobile viewport.
- Wallet selector now wraps to its own full-width row on Transactions while keeping type chips compact.

### QA results

- Home, Transactions, Budget, Goals, Profile, and Insights were checked at 390 × 844.
- No horizontal overflow remained after the Transactions filter fix.
- Bottom navigation is present and aligned on all checked routes.
- Global add/FAB is visible on Home and hidden on Transactions, Budget, Goals, Profile, and Insights.
- No `NaN` or `undefined` text was detected in checked route content.
- Add Transaction chooser and Add Transaction sheet fit the mobile viewport; sheet content remains scrollable.
- Dark mode smoke check passed on Home and Profile; no overflow detected in Profile dark mode.
- Console errors: none.

### Evidence

- `tmp/final-mobile-visual-qa-2026-07-01/home-viewport.png`
- `tmp/final-mobile-visual-qa-2026-07-01/transactions-viewport-after-fix.png`
- `tmp/final-mobile-visual-qa-2026-07-01/budget-viewport.png`
- `tmp/final-mobile-visual-qa-2026-07-01/goals-viewport.png`
- `tmp/final-mobile-visual-qa-2026-07-01/profile-viewport.png`
- `tmp/final-mobile-visual-qa-2026-07-01/insight-viewport.png`
- `tmp/final-mobile-visual-qa-2026-07-01/transaction-chooser-viewport.png`
- `tmp/final-mobile-visual-qa-2026-07-01/transaction-sheet-viewport.png`
- `tmp/final-mobile-visual-qa-2026-07-01/home-dark-viewport.png`
- `tmp/final-mobile-visual-qa-2026-07-01/profile-dark-viewport.png`
- `tmp/final-mobile-visual-qa-2026-07-01/qa-result-after-fix.json`

### Checks

- `npm run test`: passed, 26 tests.
- `npm run lint`: passed.
- `npm run build`: passed.

### Notes

- No commit, push, or deploy was performed.
- Build still reports the existing non-blocking Vite chunk-size warning.

## Final consistency pass — currency, i18n, FAB, import foundation

- Date: 2026-06-27
- Local app: `http://127.0.0.1:5174/`
- Primary viewport: 390 × 844 mobile.
- Additional viewports checked: 375 × 812 and 430 × 932.

### Fixes applied

- Added one safe money formatter path via `formatMoney()`/`formatCurrency()` so invalid values render as zero instead of `NaN`.
- Auth and transaction forms use custom validation instead of native browser validation prompts.
- Language/region/currency selectors now include accessible labels.
- English security copy now matches the Indonesian meaning: data is only accessible from the user’s PocketGo account.
- Currency preview in Settings follows the selected currency immediately; IDR appears only in the exchange-rate label when USD is selected.
- Exchange-rate settings were simplified: primary currency selector first, advanced/manual-rate controls under an advanced section.
- Demo data now follows language and currency: English+USD uses realistic USD names/amounts; Indonesian+IDR uses Indonesian names/Rupiah amounts.
- Global FAB is limited to Home, Transactions, Budgets, and Goals, and is hidden on Profile/Settings and modal flows.
- Added safe import/scan foundation in transaction entry, Transactions, and Profile/Settings: PDF/PNG/JPG/WebP up to 10MB, preview/status only, no OCR and no automatic transaction creation.

### QA results

- 375 × 812, 390 × 844, and 430 × 932 Home: no horizontal overflow; Total Balance, Safe to Spend, and Spending Overview are visible.
- More/Profile: global FAB hidden.
- Transactions: Import button visible; global plus opens chooser with Expense, Income, Transfer, Balance correction, Scan receipt, and Upload statement.
- Settings currency modal in USD: currency preview shows `$12,450.75`; exchange rate is clearly labeled as `1 USD = ... IDR`.
- English+USD demo: verified English merchant/category names and realistic USD amounts.
- Indonesian+IDR demo: verified Indonesian copy, Rupiah amounts, Indonesian transaction names, and updated security copy.
- Import modal: verified accepted file types and “manual review only” copy.

### Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 15 tests.
- `npm run build`: passed.

### Notes

- No commit, push, or deploy was performed.
- Build still reports a non-blocking Vite chunk-size warning for large bundled chunks.

## Critical bug fix — scroll unlock after currency change and USD symbol

- Date: 2026-06-28
- Local app: `http://127.0.0.1:5174/`
- Viewports checked: 375 × 812, 390 × 844, 430 × 932.

### Root cause

- Currency conversion could open the confirmation modal while the language/currency modal was still mounted.
- Each modal previously saved/restored `document.body.style.overflow` independently.
- With two active modals, cleanup order could restore the second modal’s saved value (`hidden`) after the first modal restored normal scrolling, leaving the app scroll-locked.

### Fixes applied

- Modal body scroll lock now uses a ref-counted lock/unlock flow and restores body/html overflow only after the last modal closes.
- Modal cleanup also restores related body/html style fields that could affect mobile scrolling.
- Currency settings now closes the original settings modal before showing the conversion confirmation modal, preventing stacked modal locks.
- `formatMoney()` now manually formats USD as `$` for all locales, avoiding `US$` in Indonesian locale.
- IDR formatting is fixed to 0 decimals: Indonesian uses `Rp`, English uses `IDR`.

### QA results

- USD → IDR conversion: after confirm, `.modal-backdrop` count was 0 and body/html overflow values were empty.
- IDR → USD conversion: after confirm, `.modal-backdrop` count was 0 and body/html overflow values were empty.
- Currency preview verified:
  - Indonesian + USD: `$12.450,75`
  - Indonesian + IDR: `Rp 12.450.750`
- No `US$` text appeared in checked pages after either conversion.
- Scroll after USD → IDR passed on:
  - Dashboard
  - Transactions
  - Budget
  - Goals
  - Profile
- Scroll after IDR → USD passed on:
  - Dashboard
  - Transactions
  - Budget
  - Goals
  - Profile
- Import modal opened and closed normally after currency change; body/html overflow returned to normal.
- FAB opened transaction chooser on Transactions after currency change; closing the chooser restored scroll.
- Bottom nav clicked through to Home after currency change with no leftover overlay.
- Console errors: none.

### Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 17 tests.
- `npm run build`: passed.

### Notes

- No commit, push, or deploy was performed.
- Build still reports the existing non-blocking Vite chunk-size warning.

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
- Fix: route/session loading uses a reusable branded loading screen instead of raw text-only `Loading PocketGo...`.
- Fix: default Global demo uses USD, while Indonesian/Indonesia demo uses IDR/Rp formatting.
- Fix: demo data is generated from the selected language/region/currency and stays session-local.
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
- Demo state now respects selected locale/currency: Global defaults to USD; Indonesia can show IDR/Rp.
- Branded loading is used for session restore, route Suspense, auth callback, and slow loading fallback.
- Main navigation is now Home, Accounts, Transactions, Budgets, More.
- Home follows the dashboard board structure: greeting, notification icon, navy total balance card, income/expense cards, spending donut, quick actions, recent transactions, and security alert.
- Home now answers the user’s practical questions first: safe daily spend, days until income, money reserved for commitments, 7-day risk, upcoming bills/debt, goal progress, and one advisor card.
- Accounts, Transactions, Budgets, Goals, Insights, and Settings are deferred for a later fidelity pass beyond the foundation.
- Transactions list rows now have stronger hierarchy for title, wallet/category text, amount color, and transaction icons.
- Google OAuth is wired to Supabase with a fail-safe local timeout that clears the “Connecting to Google...” state and shows a friendly fallback if the OAuth start does not complete.

## Functional evidence

- `npm run lint`: passed.
- `npm run test`: passed, 11 tests.
- `npm run build`: passed.
- Mobile Playwright QA via Google Chrome system executable: passed.
- PWA smoke check: `manifest.webmanifest` and `sw.js` reachable locally.
- Body width equals viewport width (`390px`); no horizontal overflow detected.
- Console errors: none on local app flow.
- Page errors: none.

## Screenshots

- `tmp/focused-auth-demo-polish-qa/01-splash.png`
- `tmp/focused-auth-demo-polish-qa/02-login-default.png`
- `tmp/focused-auth-demo-polish-qa/03-demo-usd.png`
- `tmp/focused-auth-demo-polish-qa/04-signup-from-demo.png`
- `tmp/focused-auth-demo-polish-qa/05-demo-idr.png`

## Follow-up polish

- [P3] Budgets route still reuses the existing Plan implementation internally, with budget/goal/bill/debt sections grouped under the new nav label.
- [P3] Google code is connected to Supabase OAuth, but successful provider login depends on Supabase Google provider and redirect URL configuration.
- [P3] Apple remains disabled/Soon until provider support is intentionally enabled.
- [P3] Some reference-board screens are approximated with existing data models instead of new backend tables.

## Final result

final result: passed

---

# Mobile UI corrective pass — Home priority, wallet CRUD, category budgets, goal wallets, dark mode

- Date: 2026-06-26
- Local app: `http://127.0.0.1:5174/`
- Viewport: 390 × 844 mobile.
- Evidence folder: `tmp/mobile-ui-fix-qa/`

## UX research decisions applied

- Use a decision-first Home pattern: total balance as the primary anchor, then daily safe money, runway, and reserved commitments as supporting figures.
- Replace forward-looking forecast visuals with a simpler income-vs-expense diagram because users asked for current money movement over projection.
- Budget creation follows category-first behavior, matching common personal finance patterns where users budget food, transport, shopping, bills, etc.
- Goal creation uses a dedicated wallet/pot pattern so saved money is visibly separated from spending money without counting it as income.
- Wallet management is surfaced in Settings/More because accounts/wallets are foundational and should not be hidden behind onboarding.
- Dark mode is a local UI preference and does not affect financial data.

## Functional evidence

- Home mobile: total balance is now the main card value; Safe to Spend, runway, and reserved are small supporting metrics.
- Home mobile: forecast card removed from Home and replaced with income/expense diagram.
- Google OAuth: guarded behind `VITE_ENABLE_GOOGLE_OAUTH=true`; when the provider is not enabled, the app shows a friendly local error instead of navigating to raw Supabase JSON.
- Wallets: More page now shows wallet list, add wallet modal, and edit wallet modal. QA opened both modals without creating fake data.
- Budgets: budget modal requires category selection first and supports optional label plus spending limit.
- Goals: goal modal explains that a dedicated goal wallet will be created and offers an optional source wallet for initial transfer.
- Dark mode: toggle works and was returned to light mode after QA.
- Modal scrolling: form bottom padding added so final fields are not hidden behind sticky submit buttons.

## Screenshots

- `tmp/mobile-ui-fix-qa/home-390.png`
- `tmp/mobile-ui-fix-qa/plan-390.png`
- `tmp/mobile-ui-fix-qa/more-390.png`
- `tmp/mobile-ui-fix-qa/more-dark-390.png`
- `tmp/mobile-ui-fix-qa/wallet-modal-390.png`
- `tmp/mobile-ui-fix-qa/wallet-edit-modal-390.png`
- `tmp/mobile-ui-fix-qa/budget-modal-390.png`
- `tmp/mobile-ui-fix-qa/goal-modal-390.png`

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 11 tests.
- `npm run build`: passed.

---

# Strict native icon and bottom navigation corrective pass

- Date: 2026-06-30
- Local app: `http://127.0.0.1:5174/`
- Reference: `docs/design/reference-ios-macos-icons.png`
- Scope: UI-only icon system, bottom navigation, quick actions, transaction icons, category grid, settings/account/auth status icons.

## Fixes applied

- Added a single `NativeAppIcon` system with rounded-square iOS/macOS-style containers, glossy highlight, tone-specific gradients, solid filled glyphs, and light/dark variants.
- Updated `PremiumIcon` wrapper to route through `NativeAppIcon`, including utility icon support.
- Bottom nav active state now uses 42px rounded-square native icon with pop motion; inactive state remains muted glyph-only at 30px.
- Bottom nav glass uses blur/saturate treatment in light and dark mode.
- Dashboard quick actions use 50px solid native icons in 90px+ tap targets.
- Transaction rows use 42px category-specific native icons; income rows now map to income category icons instead of a generic arrow.
- Add transaction chooser and segmented control use native icons for expense, income, transfer, and balance adjustment.
- Category grid uses 3 columns, 80px tiles, 44px native icons, and 24px glyphs.
- Settings/account/auth/import/scan visible status icons were moved off legacy `brief-icon` where they are primary UI icons.
- FAB behavior verified: visible only on Home; hidden on Transactions, Budget, Goals, and Profile.
- `Simpan/Save transaction` button verified as emerald `#18B57D`.

## QA verified

- 390 × 844 light mode:
  - Home quick icon: 50px.
  - Quick tile: 98px.
  - Bottom nav active: 42px.
  - Bottom nav inactive: 30px.
  - Nav background: `rgba(255,255,255,0.78)` with `blur(22px) saturate(160%)`.
- 390 × 844 dark mode:
  - Native icon dark glossy gradient active.
  - Bottom nav background: `rgba(18,18,20,0.72)` with `blur(24px) saturate(160%)`.
  - Inactive nav muted and readable.
- Transactions:
  - FAB hidden.
  - Row icons are 42px and category-specific.
  - No horizontal overflow.
- Add transaction modal:
  - Chooser icons are 42px.
  - Category grid icons are 44px with 24px glyphs.
  - Category tiles are 80px.
  - Save button background is `rgb(24, 181, 125)`.
- Viewports:
  - 375 × 812: Home, Transactions, Budget, Goals, Profile — no horizontal overflow; active nav remains 42px.
  - 430 × 932: Home, Transactions, Budget, Goals, Profile — no horizontal overflow; active nav remains 42px.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 22 tests.
- `npm run build`: passed.
- Build note: Vite still reports existing large chunk warning for app bundle/code splitting.

## Notes

- No commit, push, or deploy was performed.

---

# Corrective premium icon + iOS UX polish pass

- Date: 2026-06-30
- Local app: `http://127.0.0.1:5174/`
- Viewports checked: 375 × 812, 390 × 844, 430 × 932.

## Research decisions applied

- Apple HIG app/icon guidance favors one clear focal shape, simple recognizable symbols, and consistent rounded icon containers.
- Modern iOS visual direction uses layered material, subtle highlights, and depth instead of flat web-style icon buttons.
- PocketGo icons now use colored rounded-square containers, centered Lucide glyphs, subtle gradient depth, thin border, and light shadow.

## Fixes verified

- FAB is only rendered on Home; Transactions, Budget, Goals, Profile, and transaction sheets do not show the global FAB.
- Quick Action icons are centered inside their rounded-square containers across 375, 390, and 430px mobile widths.
- Bottom navigation active state uses a premium rounded-square icon treatment; inactive state stays quieter.
- Transaction rows use category/merchant-aware icons, including Coffee Shop → coffee icon.
- Transaction amount and delete button no longer overlap in 375, 390, or 430px checks.
- Add Transaction bottom sheet uses iOS-style rounded sheet, emerald save button, scrollable content, and 3-column category grid.
- Expense category picker has 28 visible default categories with 28 unique glyphs; no fallback grid icon remains for the checked defaults.
- Debt Payment, Credit Card, and Buy Now Pay Later now use separate icons.
- Dark mode surfaces use gray/near-black iOS-style depth tokens; no invisible text was detected in checked pages.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 22 tests.
- `npm run build`: passed.

## Notes

- Build still shows the existing Vite chunk-size warning for large bundles; it does not block the production build.
- No commit, push, or deploy was performed.

---

# Native iOS/macOS icon system pass

- Date: 2026-06-30
- Local app: `http://127.0.0.1:5174/`
- Reference file: `docs/design/reference-ios-macos-icons.png`
- Viewport checked: 390 × 844.

## Audit notes

- Existing primary icon usage was concentrated through `PremiumIcon`, with remaining raw Lucide usage mostly in utility/header controls.
- `PremiumIcon` was converted into a compatibility wrapper so existing Home, Transactions, Profile, Accounts, transaction sheet, and category picker icons route through the new native icon system.
- A new `NativeAppIcon` component now owns icon names, tones, sizes, variants, filled glyph rendering, and light/dark treatment.

## Fixes verified

- Added filled-icon library `@phosphor-icons/react` to replace outline-only main icon rendering.
- `NativeAppIcon` renders rounded-square container, gradient background, filled glyph, highlight layer, border, and shadow.
- Light mode icon tokens follow Apple-like green/blue/amber/purple/coral/teal/navy/gray palette from the prompt.
- Dark mode icon tokens use darker boxes with bright glyphs and controlled glow.
- Bottom navigation uses glass translucent background with blur/saturate and fallback background.
- Bottom nav inactive icons are muted gray without strong square container.
- Bottom nav active icon becomes a 42px rounded-square container with scale/opacity motion.
- Quick Action icons use 50px containers and filled glyphs with the prompt’s functional tones.
- Needs Attention, Recent Transactions, Wallet/Profile, Accounts, Settings, and category icons route through the native filled icon system where already using `PremiumIcon`.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 22 tests.
- `npm run build`: passed.

## Notes

- Build still shows the existing Vite chunk-size warning for large bundles; it does not block the production build.
- Adding `@phosphor-icons/react` increased the main JS bundle; code-splitting can be handled separately.
- No commit, push, or deploy was performed.

---

# Follow-up corrective icon pass — Quick Action, Needs Attention, Wallet/Profile

- Date: 2026-06-30
- Local app: `http://127.0.0.1:5174/`
- Viewport checked: 390 × 844.
- Reference: provided premium rounded-square PocketGo icon board.

## Fixes verified

- Quick Action individual white cards were removed; buttons now use transparent slots with navy glossy rounded-square icons.
- Quick Action glyphs are all white/light and consistent: plus, chart/pie, target, receipt.
- Quick Action labels are clamped to two lines and no longer overflow outside the slot.
- Needs Attention rows now use distinct icons per item: internet/wifi, subscription/calendar, paylater/percent badge.
- Recent transaction rows use merchant/category-aware icons instead of generic arrows where useful.
- Wallet icon was redesigned from `WalletCards` to cleaner `WalletMinimal`.
- Profile/More wallet rows and Accounts wallet rows now use the same premium icon system as settings/profile.
- Browser QA found no icon overflow in Home, More/Profile, or Accounts.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 22 tests.
- `npm run build`: passed.

## Notes

- Build still shows the existing Vite chunk-size warning for large bundles; it does not block the production build.
- No commit, push, or deploy was performed.

---

# Premium iOS icon polish pass

- Date: 2026-06-29
- Local app: `http://127.0.0.1:5174/`
- Reference: provided premium rounded-square PocketGo icon style board.
- Viewport QA: 390 × 844 mobile.
- Final result: passed.

## Fixes verified

- Added reusable `PremiumIcon` system for rounded-square glossy icons with gradient surfaces, soft shadows, thin borders, inner highlight, and dark-mode variants.
- Bottom navigation now uses premium active/inactive icon states with press feedback and no active icon overflow.
- Home quick action icons now use the premium icon system.
- Transaction chooser icons now use consistent green/coral/blue/amber premium states.
- Transaction list icons now map category/type to premium finance icons.
- Category chips in the transaction form now use compact premium icons.
- Transaction row delete button no longer inherits the full row button layout; it stays inside the transaction bubble.

## Mobile QA

- Transactions page at 390 × 844:
  - `navOk`: passed.
  - `rowsOk`: passed.
  - `overflows`: none.
  - transaction row icons remain inside their bubble.
  - row delete icons remain inside their bubble.
- Dark mode icon check:
  - premium icon gradients, text/icon color, and borders are visible.
  - bottom nav icons remain inside their tab cells.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 22 tests.
- `npm run build`: passed.

## Notes

- No transaction, wallet, currency, import/OCR, Supabase, or RLS logic was changed.
- No commit, push, or deploy was performed.

---

# Corrective iOS icon + dark mode gray pass

- Date: 2026-06-29
- Local app: `http://127.0.0.1:5174/`
- Reference: provided PocketGo premium iOS-style icon board.
- Viewport QA: 390 × 844 mobile.
- Final result: passed.

## Fixes verified

- Corrected `PremiumIcon` sizing and rendering toward the reference: larger centered glyphs, rounded-square container, matte/glass gradient, controlled highlight, and reduced neon glow.
- Bottom nav active/inactive icon states now keep the active container inside the tab and avoid layout overflow.
- Quick action icons use consistent 48px rounded-square containers.
- Category picker is now a 3-column icon grid; category icons are 42px rounded-square containers instead of tiny pill icons.
- Settings/Profile icons use 40px iOS-style rounded-square tiles.
- Transaction rows now reserve separate right-side space for amount and delete button.
- Transaction amount no longer overlaps the delete icon; transaction icons and delete controls stay inside the row.
- Dark mode navy surfaces were replaced with iOS gray surfaces:
  - page/background: near-black/gray
  - cards/list rows: `#1c1c1e`
  - grouped/hero surfaces: `#2c2c2e → #1c1c1e`
  - bottom nav: translucent gray

## Mobile QA

- Transactions page at 390 × 844:
  - `rowsOk`: passed.
  - `navOk`: passed.
  - amount/delete overlap: none.
  - icon/amount overlap: none.
  - row icon and delete button stay inside row bounds.
- Category picker:
  - 28 categories rendered.
  - icon size: 42 × 42.
  - grid: 3 columns.
  - chip icon overflow: none.
- Home dark mode:
  - balance card, attention cards, quick actions, and bottom nav use gray iOS dark surfaces.
  - no navy background remained in the checked Home surfaces.
- More/Profile:
  - light mode settings icons are 40 × 40.
  - dark mode cards use `rgb(28, 28, 30)`.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 22 tests.
- `npm run build`: passed.

## Notes

- No transaction, wallet, currency, import/OCR, Supabase, or RLS logic was changed.
- No commit, push, or deploy was performed.

---

# Profile iOS Settings UI polish

- Date: 2026-06-29
- Local app: `http://127.0.0.1:5174/more`
- Viewport checked: 390 × 844 mobile.
- Reference: iOS Settings grouped-list screenshot from user.
- Final result: passed.

## Scope

- Updated Profile/More layout only.
- Preserved existing account sync, wallet CRUD, localization, currency, import, export, feedback, and modal logic.
- No commit, push, or deploy was performed.

## Fixes verified

- Profile page now uses an iOS-style grouped settings layout with soft gray background, rounded cards, section labels, inset dividers, and chevron rows.
- Profile identity card is larger and cleaner, matching the visual hierarchy of iOS Settings.
- Dompet section uses a grouped card, cleaner wallet rows, icon tile, balance on the right, and chevron edit affordance.
- Pengaturan, Data & Privasi, Feedback, and Account Sync are visually separated into card sections.
- Dark-mode CSS overrides were added for the new grouped settings surfaces and text colors.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 22 tests.
- `npm run build`: passed.

---

# Global iOS visual theme pass

- Date: 2026-06-29
- Local app: `http://127.0.0.1:5174/`
- Viewport checked: 390 × 844 mobile.
- Reference direction: iOS Settings grouped-list visual language, extended across the app.
- Final result: passed.

## Scope

- UI-only global visual pass.
- No transaction, wallet, transfer, balance, Supabase, OCR, auth, or persistence logic was changed.
- No commit, push, or deploy was performed.

## Fixes verified

- Global tokens changed to iOS-like system font, neutral grouped background, Apple-style blue action accent, softer separators, and larger rounded surfaces.
- Bottom navigation now uses translucent iOS tab bar styling with blue active states.
- Global FAB, primary buttons, chips, segmented controls, icon buttons, forms, and modal sheets now follow the iOS visual language.
- Cards/lists across Home, Transactions, Budget, Goals, Profile, Accounts, Insight, Notifications, auth, and forms inherit the grouped iOS card treatment.
- Icons now use rounded-square/tinted tile treatment instead of inconsistent circular/brand-heavy styling.
- Dark mode was checked through the real dashboard toggle; text/cards/nav stayed readable and the theme was restored to light mode after QA.

## Screens checked

- Home
- Transactions
- Budget
- Goals
- Profile/More
- Home dark mode

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 22 tests.
- `npm run build`: passed.

---

# Final localization, currency, scroll, and typography cleanup

- Date: 2026-06-29
- Local app: `http://127.0.0.1:5174/`
- Mobile QA widths: 375 × 812, 390 × 844, 430 × 932.
- Browser QA: Chrome system via Playwright against the local Vite server.

## Fixes verified

- Language & Region modal now uses draft-language translations immediately before saving.
- Auth language screen copy is corrected: “Choose your language and region” / “Pilih bahasa dan wilayah”; no `languageand` spacing typo.
- Demo mode regenerates localized demo data when language/region/currency changes, without mutating real user data blindly.
- Demo labels are language-driven for wallets, transactions, bills, and categories.
- Currency formatting remains clean:
  - USD uses `$`, never `US$`.
  - IDR has no decimal places.
  - USD has two decimal places.
  - Indonesian locale uses Indonesian separators.
  - English locale uses English separators.
- Currency preview in Settings uses the selected draft language/currency, not stale saved values.
- Import/scan entry points are localized in Transactions, Add Transaction sheet, and Profile/Settings.
- Bottom navigation labels match the 5-tab model: Beranda/Transaksi/Anggaran/Tujuan/Profil and Home/Transactions/Budget/Goals/Profile.
- Modal close restores document scroll lock state.
- Auth typography tightened so the language title does not break into the previous “languageand” visual issue on mobile.

## Screenshots captured

- `/tmp/pocketgo-final-auth-390.png`
- `/tmp/pocketgo-final-home-390.png`
- `/tmp/pocketgo-final-transactions-390.png`
- `/tmp/pocketgo-final-localization-modal-390.png`

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 17 tests.
- `npm run build`: passed.

## Risks / notes

- No commit, push, or deploy was performed.
- In-app browser tab control timed out during this run, so mobile QA used local Playwright with the installed Google Chrome binary.
- Playwright-managed Chromium download/extract did not complete cleanly in the local cache; system Chrome QA was used instead.
- Vite still reports the existing chunk-size warning for large bundles; build succeeds.

---

# Scan receipt / import statement MVP

- Date: 2026-06-29
- Local app: `http://127.0.0.1:5174/transactions`
- Mobile QA widths: 375 × 812, 390 × 844, 430 × 932.
- Browser QA: Playwright with local Google Chrome binary.

## Implemented

- Import is no longer only a placeholder.
- Added parser abstraction for receipt and bank statement files.
- Added scan/upload flow: select file → preview → process → draft review → user saves.
- Auto-save remains OFF; no imported transaction is saved without explicit user review.
- Receipt review modal includes editable type, amount, date, merchant, wallet, category, notes, confidence, source file, duplicate flag, and sticky save actions.
- Statement review supports multiple draft rows with approve/select/reject/save controls.
- Auto-category engine added with user-rule priority, default ID/EN keyword mappings, fallback category, matched confidence, and duplicate detection.
- Category learning rule added when user changes the suggested category.
- Real image OCR/backend is not yet connected. Image parsing can use deterministic filename signals; raw PDF/text extraction uses browser `File.text()` when available. If parsing is unavailable, the app shows a safe manual-add state.

## QA verified

- Example `nasi-padang-sederhana-rp-28000.jpg` creates a receipt draft.
- Expected category: `Makan & Minum`.
- Draft amount parsed: `28000`.
- User can edit amount to `30000`.
- User can save only after review.
- Saved transaction appears in the current transaction list and updates through existing transaction logic.
- Invalid `.txt` upload is rejected with localized unsupported-file copy.
- Import modal opens cleanly at 375, 390, and 430 mobile widths.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 19 tests.
- `npm run build`: passed.

## Risks / notes

- No commit, push, or deploy was performed.
- No Supabase migration was added for scanned documents/drafts/category rules in this pass; the MVP flow is frontend/local state first to avoid schema risk.
- Production OCR/PDF parsing still needs a backend/Edge Function or OCR provider before real receipt images can be read reliably.
- Vite still reports the existing large chunk warning; build succeeds.

---

# Supabase OCR pipeline — scanned documents, drafts, Edge Function

- Date: 2026-06-29
- Supabase project: `jozyoifsfkojsokhsfcl`
- Edge Function: `process-receipt`

## Implemented

- Added private Supabase Storage bucket `transaction-imports`.
- Added database tables:
  - `scanned_documents`
  - `imported_transaction_drafts`
  - `category_rules`
- Added RLS:
  - users can only access their own scanned documents and drafts.
  - user category rules are private.
  - default category rules with `user_id is null` are readable by all, but not editable by users.
  - storage files are isolated by first folder segment `{userId}/...`.
- Added Edge Function `process-receipt`:
  - verifies JWT user.
  - loads owned scanned document.
  - downloads file from private Storage.
  - runs OCR adapter.
  - parses raw OCR text.
  - stores raw text and imported draft rows.
  - never saves final transactions automatically.
- Added OCR adapter:
  - `OCR_PROVIDER=google_vision` uses Google Vision document text detection for images.
  - `OCR_API_URL` supports a custom OCR endpoint.
  - missing secrets return `OCR_NOT_CONFIGURED`.
  - mock OCR only runs when `ENABLE_MOCK_OCR=true`.
- Frontend cloud import now uploads file to Storage, creates scanned document metadata, invokes the Edge Function, and shows review drafts from Supabase.
- Demo/local import remains frontend-only and safe.
- If amount is missing, Review Transaction shows empty amount warning and save is disabled until user fills it.
- Merchant is parsed from OCR text; cloud OCR does not use filename as merchant/note.

## Deploy status

- `supabase db push --linked --yes`: applied `202606290001_scan_import_ocr.sql`.
- `supabase functions deploy process-receipt --use-api --project-ref jozyoifsfkojsokhsfcl`: deployed successfully.
- `supabase db push --dry-run --linked`: remote database is up to date.

## Required secrets before real OCR works

```bash
supabase secrets set OCR_PROVIDER=google_vision
supabase secrets set OCR_API_KEY=your_ocr_api_key_here
supabase secrets set ENABLE_MOCK_OCR=false
```

For a custom OCR API:

```bash
supabase secrets set OCR_PROVIDER=custom
supabase secrets set OCR_API_URL=https://your-ocr-endpoint.example.com
supabase secrets set OCR_API_KEY=your_ocr_api_key_here
```

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 22 tests.
- `npm run build`: passed.

## Risks / notes

- OCR provider secret is not set here because no real OCR key was provided.
- Until OCR secrets are set, cloud scan returns `OCR_NOT_CONFIGURED` and the app shows manual fallback.
- PDF mutasi needs a custom OCR/PDF endpoint via `OCR_API_URL`; Google Vision image path in this implementation is for image receipts.
- Supabase CLI reported Docker cache warning during `db push`, but migration applied successfully.

---

# Mobile corrective UI/UX pass — viewport fit, dashboard priority, dark mode

- Date: 2026-06-27
- Local app: `http://127.0.0.1:5174/`
- Primary viewport: 390 × 844 mobile.
- Additional viewports checked: 375 × 812, 393 × 852, 414 × 896, 430 × 932.
- Evidence folder: `tmp/corrective-ui-qa/`

## Fixes applied

- Auth/login/register/splash/onboarding were compacted so the initial screens fit one viewport without scrolling at 375 × 812 and 390 × 844.
- Dashboard priority was corrected: saldo total remains primary, income/expense metrics stay compact, quick actions moved above the chart, and “Yang perlu diperhatikan” appears before deeper analytics.
- “Spending Overview” copy changed to “Ringkasan Pengeluaran”; `Goals` changed to `Tujuan`.
- Light color tokens were cleaned up to avoid neon/lime accents; emerald/mint are now the primary success/action colors.
- Dark mode surfaces, text, chips, cards, forms, icons, quick actions, and alerts were reviewed and retokenized for better readability.
- Default goal wallet color now uses Emerald instead of lime.

## QA results

- Auth/login viewport: no vertical scroll and no horizontal overflow on all checked viewports.
- Dashboard and scroll pages: horizontal overflow is 0 on checked viewports.
- Transactions, Anggaran, Tujuan, Profil, and Insight dark-mode screenshots were captured at each checked viewport.
- No console/page errors were reported by the Playwright viewport smoke test.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 11 tests.
- `npm run build`: passed.

## Notes

- No commit, push, or deploy was performed.
- The existing `scripts/visual-qa.mjs` still contains older text expectations, so this pass used a temporary Playwright smoke script instead of the stale script.

---

# Currency exchange polish — IDR/USD realtime rate and manual override

- Date: 2026-06-27
- Local app: `http://127.0.0.1:5174/`
- Evidence folder: `tmp/currency-qa/`

## Fixes applied

- Added profile exchange-rate settings for USD/IDR: realtime, manual, and fallback.
- Realtime rate uses `https://api.frankfurter.dev/v2/rate/USD/IDR`; fallback is `1 USD = Rp17.000`.
- Settings now confirms before changing base currency when financial data already exists.
- Wallet balances are converted into the selected base currency for total balance.
- Monthly income/expense and spending/category insight totals use base-currency conversion.
- Transaction rows still show the original transaction/wallet currency so existing data is not silently rewritten.
- Cross-currency transfers are blocked for now to prevent incorrect double-entry balance sync.
- Added Supabase migration for profile exchange-rate fields and optional transaction currency fields.

## QA results

- Realtime fetch returned USD/IDR rate `17942` locally.
- Switching Settings currency to USD changed Dashboard amounts to USD.
- No console/page errors were reported during the Playwright smoke test.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 12 tests.
- `npm run build`: passed.

## Notes

- Supabase CLI was not available in the Codex shell (`supabase: command not found`), so the migration was created but not pushed.
- Run `supabase db push` from a terminal where Supabase CLI is available before using the new cloud profile fields.

---

# Master UI corrective pass — final nav, Goals, transaction chooser

- Date: 2026-06-26
- Local app: `http://127.0.0.1:5174/`
- Viewport: 390 × 844 mobile.
- Reference: provided PocketGo master screens/workflow/design-system boards.

## Fixes verified

- Design tokens moved closer to the master design system: Trust Navy, Emerald, Mint, Coral, Soft Gray, Inter body, Plus Jakarta Sans headings.
- Bottom navigation now matches the final 5-area model: Home, Transactions, Budgets, Goals, Profile.
- Global mobile FAB uses a clear plus icon and opens the transaction-type chooser bottom sheet first.
- Transaction chooser shows Expense, Income, Transfer, and Balance correction with correct directional icons and soft color treatments.
- Add transaction form opens only after choosing a type; no duplicate transaction heading was visible.
- Amount input formats while typing (`100000` → `100.000`) while keeping numeric parsing intact.
- Goals is now a dedicated route and screen, using real goal state and supporting dedicated goal-wallet creation.
- Home mobile preserves the requested decision hierarchy: total balance first, then safe-to-spend/runway/reserved as smaller support metrics.
- Browser QA in demo mode did not insert data into the connected Supabase account.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 11 tests.
- `npm run build`: passed.

## Risks / notes

- No commit, push, or deploy was performed.
- Some deeper screens such as Tagihan and Insights still reuse existing Plan/Insight structures; the focused pass prioritized visual fidelity and the core navigation/workflow requested in this iteration.

---

# Dark mode audit and contrast corrective pass

- Date: 2026-06-26
- Local app: `http://127.0.0.1:5174/`
- Viewport: 390 × 844 mobile.
- Evidence folder: `tmp/dark-mode-audit-qa/`

## Screens captured

1. Home dark mode — before/after.
2. Transactions dark mode — before/after.
3. Budgets dark mode — before/after.
4. Profile dark mode — before/after.
5. Add transaction chooser sheet — before/after.

## Issues fixed

- Budgets summary cards used a bright surface with pale text in dark mode; replaced with dark navy surfaces and readable labels.
- Bottom navigation inactive labels were too dim; raised contrast and improved active state color.
- Quick action buttons inherited light-mode token behavior in dark mode; added explicit dark backgrounds and text colors.
- Delete/edit icon buttons in lists were too faint; added dark surface and stronger danger color.
- Placeholder and muted text were too low contrast; raised dark muted token and placeholder color.
- Mobile bottom padding was increased so fixed FAB/bottom nav does not hide the final content as aggressively.

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 11 tests.
- `npm run build`: passed.

## Notes

- No commit, push, or deploy was performed.

---

# Mobile UI second corrective pass — dashboard chart, account actions, dark mode

- Date: 2026-06-26
- Local app: `http://127.0.0.1:5174/`
- Viewport: 390 × 844 mobile.
- Evidence folder: `tmp/mobile-ui-second-pass-qa/`

## Research decisions applied

- YNAB-style category budgeting supports category-first budgets and spending decisions before extra charts.
- Monzo-style Pots supports separating goal money into named containers/wallets.
- Modern finance dashboard pattern should keep one primary money answer, one quick spending breakdown, and tappable account actions.
- Dark mode needs adjusted surface/text tokens, not just inverted page background.

## Fixes verified

- Home no longer adds a separate income/expense diagram. Existing Spending Overview was moved up into the former forecast position.
- Home shows realtime day/date in the header and includes a compact sun/moon dashboard toggle.
- Dark mode contrast improved for cards, nav, forms, demo banner, transaction sheet, segmented controls, and account pages.
- Accounts list row placement improved.
- Account detail actions are tappable:
  - Transfer opens transaction sheet in transfer mode with the selected wallet as source.
  - Masuk opens transaction sheet in income mode with selected wallet.
  - Riwayat navigates to Transactions.
  - Lainnya navigates to More.
- Google OAuth is no longer blocked by `VITE_ENABLE_GOOGLE_OAUTH`; it is active by default. Optional disable flag is now `VITE_DISABLE_GOOGLE_OAUTH=true`.

## Screenshots

- `tmp/mobile-ui-second-pass-qa/home-after-390.png`
- `tmp/mobile-ui-second-pass-qa/accounts-after-390.png`
- `tmp/mobile-ui-second-pass-qa/account-detail-390.png`
- `tmp/mobile-ui-second-pass-qa/account-transfer-sheet-390.png`

## Checks

- `npm run lint`: passed.
- `npm test -- --run`: passed, 11 tests.
- `npm run build`: passed.
