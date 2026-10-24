# Delivery plan and acceptance gates

Planning baseline reviewed: 24 October 2026. All three editions have local workflows; this plan addresses the remaining route to an accepted commercial trial. It is not a delivery promise or authorization to deploy.

## Assignment and sequencing

The project lead assigns a named implementer, reviewer and target date to each accepted work item. The roles below identify accountability only; staffing and dates are currently unassigned. Start with trial scope, then unblock environment and assurance work. Parallelize only tasks with agreed interfaces and separate ownership under [AGENTS.md](AGENTS.md).

| ID | Priority / owner | Deliverable and dependencies | Acceptance evidence |
| --- | --- | --- | --- |
| D01 | P0 / Product owner | Define pilot organizations, supported products, manual versus integrated payment model, data allowed and success criteria. No prerequisite. | Approved scope and explicit exclusions; each capability mapped to an acceptance case. |
| D02 | P0 / Release owner | Resolve authorized GitHub/source and Sites publication access; preserve hosting identity/audience. Depends on D01. | Source revision confirmed remotely; target deployment and access configuration recorded. No credential workaround. |
| D03 | P0 / Security lead | Validate trusted identity ingress, separate users, role restrictions, member links, revocation and tenant boundaries. Depends on target environment from D02. | Denied and permitted request evidence with at least two real identities; security findings resolved or explicitly dispositioned. |
| D04 | P0 / Finance reviewer | Independently review journals, annual-flat rounding, schedule/repayment allocation, cash reserves, savings holds, group share-out and supported corrections. Depends on D01. | Signed reconciliation examples and reviewed adversarial/concurrency cases. Implementation author cannot provide independent sign-off. |
| D05 | P0 / Operations lead | Define and exercise deployment recovery, D1 and R2 backup/restore, monitoring and incident ownership. Depends on D02 and agreed recovery targets. | Successful isolated restore including evidence files; balances/access verified; alert exercise and recovery results recorded. |
| D06 | Conditional P0 / Integration lead | Integrate a payment provider only if D01 requires it. Depends on provider choice, credentials and confirmation contract. | Callback authenticity, duplicates, failure/reordering, reconciliation and sandbox tests; no synthetic success responses presented as live. |
| D07 | Conditional P0 / Data migration lead | Import historical member balances/loans only if required. Depends on source data, D04 and D05. | Reconciled source totals, per-member exceptions, signed acceptance and recovery rehearsal. |
| D08 | P1 or scope-dependent P0 / Backend lead | Design digital transaction corrections and required debt lifecycle products. Depends on D01 and finance decisions. | Append-only accounting design, role/state rules, audit trail and reviewed correction tests. Unsupported cases remain blocked. |
| D09 | P1 / Platform lead | Add pagination, aggregate queries, quotas and capacity measurement appropriate to D01. | Agreed workload and latency/error budget tested with measured bottlenecks and isolated tenant results; no unsupported scale claim. |
| D10 | P0 / Product and QA leads | Complete browser/accessibility checks and customer acceptance for selected workflows. Depends on applicable D03–D08 gates. | Accepted success/error/empty states, narrow-screen and keyboard checks, customer sign-off and known limitations. |
| D11 | P0 / Release owner | Release the accepted build to the authorized audience. Depends on all applicable P0 gates and specialist acceptance. | Version, migrations, checks, independent reviews, audience, recovery plan and post-deployment verification recorded. |

P0 means a blocker for the agreed trial scope. P1 means follow-up unless customer volume or product selection makes it necessary for that trial. No item is considered complete merely because its implementation exists locally.

## Work-item contract

Every implementation task must record its ID, named owner/reviewer, acceptance criteria, files/interfaces, dependencies, data effects, test plan and actual result. Include a migration/recovery approach when applicable. Record product decisions in a focused document under docs/ rather than burying them in chat history.

## Stop and escalation conditions

Escalate an unresolved money rule to the finance reviewer, an access/privacy decision to the security lead, scope to the product owner and release access to the release owner. Continue independent authorized work while blocked. Do not bypass approval rejection, weaken a control or erase ledger history to meet a date.

## Current release position

The application remains a supervised local trial. [TRIAL-STATUS.md](TRIAL-STATUS.md) is the current readiness record; [VERIFICATION.md](VERIFICATION.md) describes existing evidence. No new test, remote push, independent approval or deployment is claimed by this planning update.
