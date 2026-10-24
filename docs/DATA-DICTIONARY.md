# Data dictionary and ledger reference

Scope: current D1/SQLite schema and application JSON conventions. db/schema.ts plus applied SQL in drizzle/ define the actual schema; not all trigger enforcement appears in the ORM declaration. This is not a customer-data export.

## Core tables

| Table | Key fields | Meaning and restrictions |
| --- | --- | --- |
| organizations | id, owner, name, created, tier | One tier constrained to 1/2/3; owner is a legacy non-platform identity linkage. New registrations use an unassigned marker plus organization_admin membership. Platform assignments never gain operations through owner. |
| records | id, tenant, kind, name, data, version, created | JSON TEXT details, parsed by the API; optimistic integer version. Generic table is not database-immutable. |
| platform_roles | user_id, email, role, created | Separate server assignment constrained to platform_admin; matching identity ID or normalized email denies tenant access. |
| platform_audit | id, actor, action, target, created | Immutable platform events and command receipts, separate from organization audit and journals. |
| memberships | id, tenant, email, role, created | Unique tenant/email pair. Email-based role linkage is separate from organization-owner user ID. |
| transactions | id, tenant, key, description, member?, source?, reverses?, actor, created | Unique tenant/key and tenant/reverses; immutable. Member/source/reversal links checked against tenant. |
| entries | id, transaction, tenant, account, amount | Signed nonzero safe integer; tenant matches transaction; debit positive, credit negative. Immutable. |
| seals | transaction, created | Validates journal has at least two entries and sum zero; prohibits later extension or seal edits/deletion. |
| audit | id, tenant, actor, action, target, created | Immutable event evidence. Not an alternative source for financial balances. |
| guards | id, ok | Batch precondition guard; insertion with ok other than 1 aborts the operation. Not a customer balance. |
| meeting_transactions | transaction, meeting, tenant | Same-tenant link from Tier 1 posting to meeting record. Opening entries are excluded. |

Timestamps are application ISO strings. Financial schedules use ISO dates and UTC calculations. The schema does not provide PostgreSQL row-level security, an automatic migration-history table for the manual setup, or a retention/deletion policy for customer records.

## Application record kinds

| Kind | Important JSON fields / behavior |
| --- | --- |
| member | Optional phone/email details by creation path. Member ledger linkage uses record ID. |
| cycle | status, sharePrice, meetingDay, quorumPercent, loanMultiple, maxPrincipal, maxMonths, annualRate, openingCash, openingAllocationReference; shared_out details after distribution. |
| meeting | cycle, date, status, attendance, counters, opening/closing cash fields, minutes and actor/timestamp details. |
| loan | Tier 1 member/cycle, principal, interest, months, policy/schedule, requestedBy, status and groupApproval. |
| digital_loan | member, principal, interest, months, policy, policyVersion, assessment, requestedBy, approvedBy, paidPrincipal, paidInterest, schedule, status and purpose. |
| digital_policy | Validated policy fields; append new record for changed terms. Default terms are in lib/digital.mjs until an organization administrator saves a policy. |
| deposit_request | member, amount, account, reference, requestedBy, status; confirmation and confirmedBy/At when confirmed. Claimed reference differs from staff confirmation reference. |
| withdrawal_request | Same request identity fields, account=savings, pending/paid/declined; pending amount reserves savings. |
| portal_access | email, member (or null after staff reassignment); membership role and same-tenant member validation still required. |
| digital_command | actor, fingerprint, result; key-derived ID within tenant; supports replay. May contain the submitted payload, so it must not leak in member responses/logs. |
| insight_review | source flag ID, note, reviewedBy, asOf. Does not alter a flagged transaction or resolve its underlying condition. |
| attachment | source, key, type, size; object body stored privately in R2. |
| reconciliation / import / notification | Supporting record kinds in Tier 1 actions; do not assume these implement a full general-purpose form/project/message product. |

The API validates kind-specific states; the generic JSON column does not enforce a complete domain schema. Direct database editing can bypass application state rules and is not an operational correction workflow.

## Ledger accounts and representative journals

| Operation | Debit (+) | Credit (-) |
| --- | --- | --- |
| Confirm digital savings deposit | cash | savings |
| Confirm restricted share deposit | cash | share_capital |
| Pay digital savings withdrawal | savings | cash |
| Disburse loan | loan_principal | cash |
| Receive digital repayment | cash for total | interest_income then loan_principal as allocated |
| Digital opening cash | cash | opening_equity |
| Tier 1 savings shares | cash | member_contributions |
| Emergency contribution | social_cash | social_fund |
| Emergency payout | social_fund | social_cash |

Other Tier 1 accounts and correction/share-out journals are defined in app/api/workspace/route.ts, app/api/meetings/route.ts and lib/tier-one.mjs. Do not rename account strings or infer a full general ledger/chart-of-accounts product from this list. On share-out, cycle_surplus_distributed records the difference between original savings weight and payout; emergency funds are excluded.

Example: a verified UGX 100,000 savings receipt posts cash +100000 and savings -100000. A pending receipt posts nothing. A loan request/approval also posts nothing, although savings/cash reservations change availability calculations. All money examples here are synthetic.

## Integrity, migration and scale

Inspect every trigger in the migration chain when changing posting. Ledger historical debit volume is bounded to the supported exact arithmetic range; a transaction cannot be extended after sealing. Transactions/entries/audit immutability differs from application-level append-only policy/command conventions.

Indexes support records by tenant/kind/date, transactions by tenant/date, entries by tenant/account and transaction, and audit by tenant/date. Current API reads are unpaginated. No throughput guarantee, database-per-tenant option or automated partitioning is implemented.

Do not migrate by copying only organizations and records: financial entries, seals, audit and meeting links must remain consistent, and R2 objects need separate recovery. Plan source reconciliation and validate member totals and access after any approved migration. See [operations](OPERATIONS.md) and [delivery gates](../BUILD-PLAN.md).
