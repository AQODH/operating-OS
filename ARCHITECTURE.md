# Multi-organization architecture

One application serves separate organizations. Every request selects one organization; the server checks the signed-in identity against that organization’s owner or email-bound membership. Roles are scoped to that organization. Changing an organization in the interface never grants access.

## Isolation boundaries
- `lib/tenancy.mjs` is shared by data and file endpoints.
- Each record, financial transaction, ledger entry and audit row carries a tenant identifier.
- Database triggers reject foreign-organization members, sources and reversals; ledger entries must match their transaction’s tenant.
- Private files use organization-prefixed object keys and are served only after membership and tenant-record checks.
- Browser requests use private/no-store responses. Organization switches clear visible data and ignore stale responses. Record tools reset on switching.
- Organization export contains only the active organization, never the account’s whole organization directory.

## Configuration
Loan policies are organization-specific immutable records. A loan stores its policy reference, policy snapshot and schedule. Publishing another organization’s policy cannot change that loan. Current calculation support is annual flat interest in UGX.

## Scaling path
Indexes cover records by tenant/kind/date, transactions by tenant/date, entries by tenant/account and transaction, and audit by tenant/date. A 100-organization/5,000-member fixture checks independent counts and query index selection. No production capacity guarantee is inferred.

Before large customer volumes, add cursor pagination, server-side aggregate reporting, object-storage retention, per-tenant quotas, queue fairness and measured load tests. The current global optimistic financial watermark serializes conflicting postings within an organization; a retry is required after a conflict.

D1 is the current preview runtime. It does not provide PostgreSQL row-level security. A PostgreSQL commercial deployment needs separate migration/deployment work and must preserve tenant checks and ledger invariants. Dedicated tenant databases are a future option for contractual or scale requirements, not an implemented capability.

## Tier 1 edition and meeting boundaries
The organizations table now stores exactly one tier (1, 2 or 3), enforced by a database constraint and scalar registration validation. Tier 2/3 are reserved editions with no Tier 1 meeting access. Existing prototype organizations migrate to Tier 1.

Tier 1 introduces savings-cycle and meeting records, plus meeting_transactions linking every new non-opening posting to its meeting. Opening and closing require matched counts of separate lending and emergency cash, attendance/quorum and two distinct attending counters. Money writes and closing use version guards and ledger watermarks to reject stale concurrent actions.

Group loan decisions record an officer’s attestation of a group resolution and two non-borrower witnesses. They do not assert independent electronic signatures or verified member consent. Cycle rules remain attached to loan terms. Pending and approved loans reserve borrowing capacity.

## Digital editions

Digital workflows live in lib/digital-server.ts; pure balance, eligibility and scenario calculations live in lib/digital.mjs. The shared workspace route dispatches by the organization's single tier. Tier 1 endpoints still reject digital organizations.

A member role is permitted only for digital organizations. A tenant-scoped portal_access record links a membership email to one existing member. Server reads filter records to that member, transactions to that member and entries to those transactions before returning data. Members receive no organization audit, membership list, lending policy or organization analysis. Attachment access stays staff-only. Reassigning or revoking membership requires owner permission and is audited.

Savings and restricted share capital have separate ledger accounts. Pending withdrawal requests and loan savings holds affect availability without rewriting confirmed balances. Approved loans reserve cash. Each digital mutation checks both the organization record/version watermark and transaction count in an atomic batch; conflicting requests fail instead of overspending. Immutable command receipts implement idempotency. Tier 3 analysis is calculated on demand from the authorized organization data; review notes cannot post ledger entries.
