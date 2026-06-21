# PocketGo Design QA

- Source visual truth: `design/reference-option-2.png`
- Implementation screenshot: `tmp/visual-qa/04-home-viewport.png`
- Side-by-side comparison: `tmp/visual-qa/home-comparison.png`
- Viewport: 390 × 844
- State: completed localized onboarding with two wallets, income, expense, linked transfer, recurring bill, goal, and PayLater debt
- Full-view evidence: Home, Plan, Transactions, Insight, More, onboarding, and transaction sheet captured by `npm run qa:visual`
- Focused evidence: compact auth selector at `tmp/visual-qa/00-auth-compact-language.png`, chooser at `tmp/visual-qa/06-transaction-chooser.png`, and transaction form at `tmp/visual-qa/07-transaction-sheet.png`

## Findings

No actionable P0, P1, or P2 findings remain.

## Fidelity review

- Fonts and typography: hierarchy matches the selected editorial direction; balance and Safe to Spend values remain readable without truncation.
- Spacing and layout: Home density now fits the 390 × 844 viewport with the quick-add action above bottom navigation. Plan, Insight, and other routes have sufficient scroll clearance.
- Colors and tokens: navy, ivory, sage, amber, and coral states consistently match the reference direction and retain accessible contrast.
- Image quality: the generated PocketGo bitmap icon is sharp and used consistently; app UI icons use Lucide rather than handcrafted SVG or CSS art.
- Copy and content: Indonesian and English core flows are consistent, practical, and do not mix languages.
- Interactions: auth language switching, localized onboarding, wallet creation, expense, income, linked transfer, recurring bill, goal, debt, language/region/currency switching, navigation, and scrollable transaction sheet were exercised.
- Transaction entry: the global plus and page add actions open a four-option chooser before the selected transaction form.

## Functional evidence

- Final total balance after QA transactions: Rp3.850.000; the same state rendered as $3,850,000.00 after switching to English/US/USD.
- Transfer persists as two linked rows but renders once in the transaction list.
- Transaction sheet: `clientHeight 745`, `scrollHeight 1066`, `overflowY auto`.
- Body width equals viewport width (`390px`); no horizontally overflowing elements detected.
- No console errors or uncaught page errors.
- PWA manifest uses standalone display, app icons are present, and `sw.js` responds successfully.

## Patches made

- Reduced Home vertical density to match the selected visual.
- Fixed total-balance truncation.
- Disabled pie-chart entry animation so the chart renders reliably during first capture.
- Removed the global floating action overlay that covered Plan and Insight content.
- Added a compact mobile quick-add action above bottom navigation.
- Added repeatable Playwright QA through `npm run qa:visual`.
- Added locale switching checks for auth and Settings, plus IDR/USD formatting assertions.
- Removed the obsolete Home quick-add section, added a global plus FAB, fixed transaction icon direction/colors, verified formatted IDR input, and asserted category chips are unique.

## Follow-up polish

- [P3] The reference offers five quick-add shortcuts; the implementation uses one simpler quick-add action to reduce clutter.
- [P3] Some icon glyphs differ from the generated concept while remaining consistent within the Lucide icon family.

## Final result

final result: passed
