# Tier 2 and Tier 3 — supervised local trial

Each organization has exactly one edition. Tier 1 meetings stay separate. Tier 2 provides digital SACCO accounts; Tier 3 includes the same account workflows with organization analysis. There is no tier reassignment endpoint.

## Tier 2

- Register members and link their sign-in email to their member record. Members can see only their own profile, requests, loans and statement. Staff roles retain organization-wide access; only the organization administrator assigns or revokes access. Evidence files are staff-only.
- Record savings and restricted share capital separately. Share capital is not withdrawable through the savings workflow.
- A member submits a deposit reference. A treasurer verifies receipt of funds and confirms it before cash and the member balance change. Confirmation references cannot be reused for another deposit. No bank or mobile-money provider is connected.
- Members request withdrawals from available savings. Pending withdrawals and loan holds reduce availability. A treasurer records a completed payout separately; the software does not send money.
- The organization administrator saves versioned annual-flat lending rules: manual, assisted or automatic approval; savings multiplier; loan/term limits; automatic limit; cash reserve. Manual and assisted both require officer review and currently share the same assessment checks. Invalid amounts/terms, policy maximum violations or insufficient savings reject a request before it is saved. Once those hard checks pass, automatic approval also requires the automatic amount limit, liquidity reserve and absence of overdue payments; failure of an automatic check leaves a submitted request for officer review.
- A loan keeps its original policy and assessment. Manual approval requires an officer other than its requester. Approval and disbursement are separate actions. Approved loans reserve cash. Repayment schedules begin at disbursement; repayment is allocated to total interest first, then principal. Overpayment is refused. Settling principal releases savings holds.
- Statements, CSV export, print, trial balance and staff audit history are available. Opening organization cash requires a sign-off reference and must be the first posting.

## Tier 3

- Cash, savings, share capital, portfolio and recent cash movement summaries are calculated from the organization ledger.
- A 30-day scenario combines cash now, outstanding scheduled collections, pending withdrawals and approved loans. A second scenario receives 50% of scheduled collections. The UI states assumptions; neither scenario predicts actual future behavior.
- Review flags cover overdue schedules, commitments above cash and repeated member-supplied deposit references. Authorized staff can record investigation notes without changing financial data. Flags remain visible while their underlying conditions remain.
- Structured questions explain commitments, cash movements and review checks using the organization's figures. No external language model, trained credit score or autonomous financial agent is connected.

## Controls and verification

All digital actions require a request key. Repeating the same actor and identical serialized request payload returns the original receipt; changed payloads cannot reuse the key. Journal entries are sealed, balanced and immutable. Atomic record and transaction guards prevent simultaneous requests from consuming the same savings. API reads enforce member scoping before returning data, including transactions and ledger entries. Revocation takes effect on the next request.

Historical verification reported 34 passing automated tests, TypeScript check, production build, live HTTP workflows for both tiers, and Tier 1 full-cycle regression. These were not rerun for the 24 October 2026 documentation review; see [verification evidence](VERIFICATION.md). Tests include member isolation/revocation, role restrictions, cross-organization record denial, duplicate confirmation/retry, restricted capital, savings/loan holds, concurrent withdrawals, policy snapshots, liquidity review, separate approval/payout, settlement and Tier 3 review notes. Browser inspection covers the edition navigation and digital pages. Local sign-in uses a development identity; real separate-user authentication still requires hosted testing.

## Before a commercial trial

This is a supervised local trial implementation. Hosted publication remains blocked by automatic approval review of source-repository write credential creation. Payment-provider callbacks, external messages, real multi-user authentication/MFA testing, operational monitoring, hosted backup/recovery, independent accounting/security review and customer acceptance remain outstanding. Existing member balance migration needs reconciliation. Correction/reversal of digital transactions, delinquency restructures, guarantors, write-offs, savings interest and regulatory reporting need dedicated workflows before relying on them. This implementation does not establish regulatory authorization or production readiness.

Run locally using the existing setup in README.md. A platform administrator registers Tier 2 or Tier 3 and assigns a separate organization administrator; that team adds members and lending rules. Use synthetic data while evaluating. Local HTTP smoke check: `node scripts/digital-trial-test.mjs` (creates clearly labeled QA organizations and synthetic entries).

## Explicit calculations and staff responsibilities

Savings availability is confirmed savings minus pending withdrawals and loan holds, floored at zero. Each active loan holds ceiling(outstanding principal / its saved savings multiplier). Restricted capital is excluded from withdrawable savings. Submitted loans also hold savings; declining a loan releases that hold. There is no automatic request expiry.

Organization administrators and treasurers can confirm money; officer and organization administrator can review requests. Manual loan decisions reject the original requester. An organization administrator can configure policy and membership. A member sees their own loan policy snapshots, but not the organization's current policy object, audit, membership directory or organization analysis. Staff access and hosting visitor access are separate configuration layers.

Annual flat interest is rounded half-up to whole UGX: principal × annual basis points × months / 120000. Example: UGX 100,000 at 1,200 basis points (12%) for one month adds UGX 1,000 interest. Repayment allocates against total unpaid interest first, then principal; it does not implement a separate interest-receivable accrual model.

The Tier 3 collection scenario includes unpaid overdue instalments as well as amounts scheduled by UTC today + 30 days. Base cash is cash now plus those collections minus pending withdrawals and approved undisbursed loans. Stress cash receives half those collections, rounded down. Declared assumptions do not constitute collection probabilities or profit forecasts.

See [architecture](ARCHITECTURE.md) for precise calculation boundaries and [delivery gates](BUILD-PLAN.md) for accountable roles and required commercial acceptance evidence.

Platform admins cannot perform organization activities. Use separate local role previews in [README.md](README.md). See [ROLE-SEPARATION.md](docs/ROLE-SEPARATION.md) for current role names and boundaries.
