# Architecture and implementation contracts

Reviewed against local source: 24 October 2026. This document describes implemented behavior and named gaps; [AGENTS.md](AGENTS.md) defines team requirements, which are not themselves proof of enforcement.

## Runtime and request flow

React/TypeScript runs through Vinext with the Cloudflare Worker runtime. D1 stores application data; Drizzle describes schema/migrations; R2 stores private evidence. The active entry is app/page.tsx. Platform admins receive app/platform-workspace.tsx; organization users receive the shell in app/tier-one-workspace.tsx. The shell renders app/digital-workspace.tsx for digital editions. Older app/workspace.tsx and app/domain-tools.tsx are retained prototype code, not the current entry flow.

1. Resolve the signed-in user through app/chatgpt-auth.ts. Portable loopback development may supply a mock identity; hosted ingress is a separate trust boundary.
2. Resolve platform_roles before tenant access. Platform admins use the separate /api/platform metadata console and are denied all organization endpoints, including legacy ownership. Other users resolve their organization role through lib/tenancy.mjs.
3. Dispatch /api/workspace by the organization's single tier. /api/meetings accepts Tier 1 only.
4. Enforce the operation's role and same-tenant references before calculating or writing.
5. For digital member reads, scope records and transactions before returning a response. Shared sensitive responses use private/no-store handling.
6. Post money, seal the journal, update source state and write audit evidence atomically with concurrency guards.

Hosting authentication and application membership are separate checks. A stand-alone deployment outside the trusted hosting ingress needs an explicit authentication design; receiving identity-shaped headers alone is not sufficient proof of identity.

## Data ownership and invariants

| Data | Representation and contract |
| --- | --- |
| Organization | organizations row with one tier constrained to 1, 2 or 3. owner remains a legacy linkage for non-platform identities; new registration uses an unassigned marker plus explicit organization_admin membership. No tier reassignment route. |
| Domain records | Tenant-scoped records with JSON details and optimistic version; kinds include members, cycles, meetings, loans, policies and requests. Validate kind and tenant at use. |
| Membership | Tenant/email role assignment; digital portal_access record binds a member-role email to an existing same-tenant member. |
| Journal | transactions and entries carry tenant IDs; signed entries sum to zero. Seals validate balanced journals and prevent extension. |
| Ledger history | Triggers prevent transaction/entry edits or deletion, cross-tenant financial links and unsupported unsafe amounts. Audit rows are immutable. |
| Digital command receipt | digital_command record stores actor, original payload fingerprint and result for replay checking. Append-only through current application actions; not a database-wide immutability constraint on all records. |
| Meeting links | meeting_transactions associates Tier 1 non-opening postings with same-tenant meeting records. |
| Evidence | R2 object key is organization-prefixed; metadata record identifies its source. Access is authorized server-side. Upload and metadata insertion are not a distributed transaction; failed metadata writes trigger object cleanup. |

Policy records are versioned by creating new records through the application; the generic records table is not globally immutable. Loans keep the applied policy snapshot. Current interest support is annual flat interest with monthly schedules in integer UGX.

## Role contract

| Capability | Organization admin | Officer | Treasurer | Viewer | Digital member |
| --- | --- | --- | --- | --- | --- |
| Read organization records | Yes | Yes | Yes | Yes | Own scoped records only |
| Add members / submit staff requests | Yes | Yes | Yes | No | Own supported requests only |
| Record financial confirmations | Yes | No | Yes | No | No |
| Review requests / manual loan decisions | Yes | Yes | No | No | No |
| Assign/revoke roles and save digital policy | Yes | No | No | No | No |
| Read organization Tier 3 analysis | Yes | Yes | Yes | Yes | No |
| Record Tier 3 review notes | Yes | Yes | No | No | No |

Operation-specific rules further restrict these rights. For example, manual digital loan decisions reject the original requester, Tier 1 decisions require meeting witnesses, and some opening/cycle actions are organization-admin-only. Staff can read evidence; uploads require a create-capable role. Members cannot read/upload evidence through the current endpoint.

Members receive their own member profile, digital loans and money requests, transactions and corresponding journal entries. They receive no organization audit history, membership list, current organization policy object or organization analysis. Their own loan records do contain the policy snapshot governing those loans. Revocation is checked again on the next request.

## Tier 1 contract

Cycle rules define share price, quorum and lending terms. Meetings record attendance, two distinct attending counters and separate lending/emergency counts. Group loan decisions record staff attestations of a resolution with two non-borrower witnesses; they do not verify independent member signatures.

Non-opening money entries link to an open meeting. New entries after closure fail; supported identical retries remain safe. Supported corrections reverse original entries within the permitted cycle/meeting context. Share-out uses integer largest-remainder allocation by member savings weight, excludes emergency funds and requires the cycle's loans to be resolved. See [Tier 1 guide](TIER-ONE-GUIDE.md).

## Digital financial contract

For a member:

- Savings balance = negative sum of savings entries on that member's transactions.
- Restricted capital = negative sum of share_capital entries on those transactions.
- Loan hold = sum of ceiling(outstanding principal / saved loanMultiple) for submitted, approved and disbursed loans.
- Pending withdrawals = total pending withdrawal requests.
- Available savings = max(0, savings balance - loan holds - pending withdrawals).

Shared cash available to a new loan assessment is cash minus pending withdrawals and approved-but-not-disbursed principal. Hard validation failures reject a request. Eligible automatic requests become approved; automatic-check failures retain a submitted request for officer review. Approval reserves cash and does not post the ledger. Disbursement creates the repayment schedule. Interest is received before principal in the repayment allocation, with interest income recognized on receipt.

Digital actions guard the tenant's record count/version total and transaction count within the final batch. Conflicting mutations fail and require refresh/retry. Request-key replay compares actor and serialized payload; a changed payload must use a new key. These checks are currently tenant-wide, which can constrain high-contention workloads.

## Tier 3 calculation contract

Analysis runs on demand for authorized organization staff/viewers. Let C be cash now, E be unpaid scheduled amounts due on or before UTC today + 30 days, W be pending withdrawals and L be approved undisbursed principal:

- Base scenario = C + E - W - L.
- Stress scenario = C + floor(E / 2) - W - L.

E includes unpaid overdue amounts, not just new instalments within the horizon. No future deposits, operating expenses or savings interest are modeled. Recent inflow/outflow summaries use a rolling 30-day timestamp window; these are cash movements, not profit.

Flags identify unpaid schedules due before UTC today, cash below W + L, or repeated normalized member-claimed references among confirmed deposits. The receipt flag is distinct from the confirmation-reference uniqueness check. Review notes do not resolve the underlying condition or change money. No external language model is connected.

## Scale, operations and known gaps

Indexes cover tenant/kind/date record access, transaction dates, account entries and audit dates. A synthetic 100-organization/5,000-member test checks counts and index selection; it is not a throughput or capacity benchmark.

Current reads load whole-tenant records/transactions/entries. Pagination, aggregate queries, quotas, retention and workload testing remain future work. D1 uses explicit application authorization and link checks, not PostgreSQL row-level security or per-tenant databases. A different database deployment requires separate design and migration.

Real identity acceptance, independent financial/security review, payment callbacks, comprehensive customer migration, digital correction workflows and hosted D1/R2 recovery remain gaps. See [status](TRIAL-STATUS.md) and [delivery gates](BUILD-PLAN.md).

## Platform role separation

See [ROLE-SEPARATION.md](docs/ROLE-SEPARATION.md). The canonical tenant administrator is organization_admin. platform_admin is a separate server assignment in platform_roles and grants no tenant operational permissions. /api/platform exposes registration metadata, administrator contacts and platform_audit history only. New registration assigns a separate non-platform administrator instead of the creator. Platform audit receipts are immutable. Digital mutations re-resolve access before command replay. The existing identity adapter is unchanged; new authentication and impersonation are not part of this change.
