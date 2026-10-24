# Current implementation and readiness

Reviewed: 24 October 2026, Africa/Kampala. Documentation review was followed by an isolated clean-install and local workflow verification, recorded in [ONBOARDING-VERIFICATION.md](docs/ONBOARDING-VERIFICATION.md). This is not independent operational/commercial acceptance. Historical check results remain in [VERIFICATION.md](VERIFICATION.md).

## Product status

| Area | Current implementation | Limit |
| --- | --- | --- |
| Edition assignment | One scalar tier per organization; registration and database constraint enforce 1, 2 or 3. | No reassignment endpoint or combined editions. |
| Tier 1 | Cycles, quorum, witnessed decisions, savings shares, separate emergency funds, lending, corrections within supported types, closing counts and share-out. | Officer attestations are not independent member signatures; full offline operation is absent. |
| Tier 2 | Member-scoped accounts, savings/restricted capital, receipt verification, withdrawal requests, holds, versioned policy, loan decisions, disbursement and repayment records. | Staff confirm external transactions manually; no provider connectivity or digital correction workflow. |
| Tier 3 | Digital finance plus ledger summaries, base/stress scenarios, condition flags and review notes. | Deterministic calculations; no trained model, external AI or autonomous financial actions. |
| Platform separation | Separate platform_admin and organization_admin; deny-first tenant access and separate registration console/audit. | Existing identity adapter only. Authentication remains deferred; independent review pending. |
| Tenant security | Organization authorization, member-scoped responses and database checks on financial links. | Real separate-user hosted access and independent security review remain unverified. |
| Accounting | Integer UGX, balanced sealed journals and atomic guarded posting. | Independent accounting acceptance and customer opening-balance migration are outstanding. |
| Operations | Local setup, CI definition and local database recovery exercise. | No proven hosted recovery, R2 restore, monitoring or production capacity. |

## Current role boundary

[ROLE-SEPARATION.md](docs/ROLE-SEPARATION.md) replaces registration-as-owner. Platform admins are denied organization operational records, meetings, money, team actions and evidence, including legacy ownership. Organization registration now uses /api/platform and assigns a separate organization administrator. Migration 0007 and separate local role previews are documented in README. No authentication feature is added. Eleven platform-role tests extend the prior 34-test suite to 45 tests. Independent review is pending; no merge or release is claimed.

## Evidence and publication

The prior implementation session reported 34 passing automated tests, a successful type check and build, Tier 1/2/3 local HTTP exercises and selected browser checks. The follow-up onboarding verification freshly passed the 34-test suite, type check, production build, seven fresh migrations, all three local HTTP workflows and local recovery. This was an isolated Windows environment; read the evidence record and VERIFICATION.md for limits.

Local identity is mocked in the portable development flow. Role isolation is exercised against application services and synthetic databases, which does not establish real authentication/MFA behavior.

No successful hosted deployment is evidenced. Sites publication was blocked by automatic review of source-repository credential creation. The most recent agent-side GitHub push attempts also failed because credentials could not be accessed; this audit does not infer whether a user subsequently pushed outside the agent. A repository upload and a hosted application deployment are separate outcomes.

## Commercial-trial acceptance gaps

The following roles are accountable functions, not named assignments or completed approvals. The project lead must assign people before scheduling delivery. Detailed acceptance criteria and dependencies are in [BUILD-PLAN.md](BUILD-PLAN.md).

| Gate | Accountable role | Required evidence | Status |
| --- | --- | --- | --- |
| Real identity and role access | Security lead | Separate-user sign-in, revocation, owner/staff/member and cross-tenant tests in the target environment. | Not established. |
| Financial acceptance | Finance reviewer | Independently reconciled journals, interest, holds, settlement, reversals and opening balances. | Not established. |
| Secure deployment | Release owner | Authorized source publication, reviewed build, deployment identifier and verified audience/identity boundary. | Blocked/unverified. |
| Payments, if trial requires them | Integration lead | Verified callbacks, retry/reconciliation evidence and provider sandbox acceptance. | Not implemented. |
| Historical balances, if imported | Data migration lead | Signed source-to-ledger reconciliation and recovery rehearsal. | Not implemented. |
| Operational recovery and monitoring | Operations lead | D1 and R2 restore exercise, access test after restore, alerts and agreed recovery targets. | Not established. |
| Customer and applicable compliance acceptance | Product owner with appropriate specialists | Documented trial scope, supported products, responsibilities and signed acceptance. | Not established. |

Digital corrections, restructures, guarantors, write-offs, savings interest and regulatory reporting remain unsupported workflows. Choose the intended trial scope explicitly before deciding which additional capabilities are release requirements. This documentation does not establish regulatory authorization.
