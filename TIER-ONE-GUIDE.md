# Tier 1 — Community Groups

## Current local build
Organizations register into exactly one edition: Tier 1, Tier 2 or Tier 3. The database stores a single integer tier with a constraint, and registration rejects arrays/multiple values. Existing prototype organizations migrate to Tier 1. Tier 2/3 registrations reserve only that edition and display an in-development screen; they cannot use Tier 1 meeting endpoints.

## Group workflow
1. Register a Tier 1 organization and add members.
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
- Every money entry links to a meeting. Closed meetings reject new money entries; retries of an already-recorded request return the original result.
- A savings/fine/emergency entry can be reversed in an open meeting in the same cycle, preserving its original record. Loan/share-out reversals remain blocked pending a controlled adjustment workflow.
- Share-out pays by member savings weight, allocates whole-UGX rounding by largest remainder, clears those member savings liabilities and records the earnings/loss allocation separately. Emergency funds carry forward.
- Opening cash requires a sign-off reference. A cycle with opening funds needs a documented allocation before share-out. This does not migrate existing member balances or loans.

## Weak connections
The meeting money form can explicitly save a device-local draft, including its submission key. Restore, review and submit it when connected. It is not posted to the ledger automatically. This works on an already-loaded page; a fully offline app reload and background synchronization are not implemented. Clear drafts on shared devices.

## Verified
26 automated tests pass. The live Tier 1 cycle test covers one-tier registration, meeting quorum, savings, loan request/approval, disbursement, repayment, loan rejection, over-reservation rejection, correction retries, emergency-fund limits, share-out, matching closing counts and locking after close.

Its worked example distributed UGX 59,900, retained UGX 2,000 in emergency cash, and left member savings and loan principal at zero after the cycle. Tier 2 meeting requests and invalid multi-tier registration were rejected.

## Trial limits
Use synthetic test data until independent accounting/security review and real-account access tests are complete. The local sign-in is a development identity. Annual flat monthly-term loans are the supported calculation; weekly loan instalments, monthly service-charge products, arrears automation, full migration, automated reminders and full offline synchronization remain further work. No money moves through this application.

Hosting is not deployed. The earlier repository-credential request remains blocked by automatic approval review; no bypass or replacement Site was used.

Browser checks also verified device draft save, restore and clear on the practice meeting, with no money transaction posted.
