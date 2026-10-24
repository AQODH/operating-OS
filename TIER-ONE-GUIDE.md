# Tier 1 — Community Groups

## Current local build
Organizations register into exactly one edition: Tier 1, Tier 2 or Tier 3. The database stores a single integer tier with a constraint, and registration rejects arrays/multiple values. Existing prototype organizations migrate to Tier 1. Tier 2/3 organizations now use their own digital workflows; they cannot use Tier 1 meeting endpoints. See [the digital guide](TIER-TWO-THREE-GUIDE.md).

## Group workflow
1. A platform administrator registers Tier 1 and assigns a separate organization administrator. That organization team adds members.
2. Agree a savings cycle: share price, usual weekly meeting day, quorum, loan multiplier, maximum loan amount/term and annual flat interest rate.
3. Open a meeting with attendance, two distinct attending money counters and matching opening counts.
4. Record share purchases, fines, repayments, loan disbursements, emergency contributions/payouts and group expenses.
5. Record a loan request within the savings-based limit. Submitted/approved loans reserve borrowing capacity.
6. An authorized officer records the group’s approval or rejection with a resolution reference and two attending witnesses other than the borrower. These are officer-recorded attestations, not verified digital signatures.
7. Count both funds, record minutes and close. Any mismatch keeps the meeting open.
8. At cycle end, settle/reject all loans, preview share-out, document the agreed payouts, then count and close the final meeting.

## Financial controls
- Lending cash and emergency cash use separate ledger accounts. Emergency funds cannot fund ordinary loans or share-out.
- Savings are recorded as whole shares at the cycle price.
- Every non-opening money entry links to a meeting. Closed meetings reject new money entries; retries of an already-recorded request return the original result.
- A savings/fine/emergency entry can be reversed in an open meeting in the same cycle, preserving its original record. Loan/share-out reversals remain blocked pending a controlled adjustment workflow.
- Share-out pays by member savings weight, allocates whole-UGX rounding by largest remainder, clears those member savings liabilities and records the earnings/loss allocation separately. Emergency funds carry forward.
- Opening cash requires a sign-off reference. A cycle with opening funds needs a documented allocation before share-out. This does not migrate existing member balances or loans.

## Weak connections
The meeting money form can explicitly save a device-local draft, including its submission key. Restore, review and submit it when connected. It is not posted to the ledger automatically. This works on an already-loaded page; a fully offline app reload and background synchronization are not implemented. Clear drafts on shared devices.

## Verified
The previous implementation session reported 34 passing tests across the whole application (26 prior tests plus 8 digital tests); this is not a new run. See [verification evidence](VERIFICATION.md). The live Tier 1 cycle test covers one-tier registration, meeting quorum, savings, loan request/approval, disbursement, repayment, loan rejection, over-reservation rejection, correction retries, emergency-fund limits, share-out, matching closing counts and locking after close.

Its worked example distributed UGX 59,900, retained UGX 2,000 in emergency cash, and left member savings and loan principal at zero after the cycle. Tier 2 meeting requests and invalid multi-tier registration were rejected.

## Trial limits
Use synthetic test data until independent accounting/security review and real-account access tests are complete. The local sign-in is a development identity. Annual flat monthly-term loans are the supported calculation; weekly loan instalments, monthly service-charge products, arrears automation, full migration, automated reminders and full offline synchronization remain further work. No money moves through this application.

Hosting is not deployed. The earlier repository-credential request remains blocked by automatic approval review; no bypass or replacement Site was used.

Browser checks also verified device draft save, restore and clear on the practice meeting, with no money transaction posted.

## Developer handoff and acceptance

Operational roles: the organization administrator establishes cycles, record keepers prepare meetings and attest decisions, and the organization administrator/treasurer records and closes money. Follow server operation checks rather than assuming a visible button grants permission. The finance reviewer must independently accept share-out and correction examples before customer use. The usual weekly meeting day is a saved preference, not a scheduler, reminder or weekly loan instalment engine.

Implementation: app/api/meetings/route.ts, Tier 1 actions in app/api/workspace/route.ts and lib/tier-one.mjs. Local exercise: `node scripts/tier-one-cycle-test.mjs`; it creates synthetic records. Documentation reviewed 24 October 2026; no fresh workflow execution is claimed by that review.

Platform admins cannot perform organization activities. Use separate local role previews in [README.md](README.md). See [ROLE-SEPARATION.md](docs/ROLE-SEPARATION.md) for current role names and boundaries.
