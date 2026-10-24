# Developer onboarding verification — 24 October 2026

## What was verified

This follow-up goes beyond the earlier [documentation audit](DOCUMENTATION-REVIEW.md): an isolated source copy received a fresh dependency installation, build, local database and live synthetic workflow exercise. The existing application on port 5173 and its data were not used for the financial exercises.

Environment: Windows, Node 24.18.0, npm 11.16.0. Source: working tree based on local commit 2c34cbc with the uncommitted documentation/tooling updates. This is not an immutable released revision or evidence that GitHub contains these updates. No dependencies, local databases, profiles, sessions or credentials were copied into the isolated source directory. Normal npm cache/registry access was available.

Lockfile SHA-256: `6f6158e72d96178c0be1c12a9b43cd42f20e2fabf4c3609b34bd0dea2338e2df`.

Compared 44 files across app/, lib/, db/, drizzle/ and worker/ between the primary and isolated source trees: no application-source mismatches. Changes in this handoff affect documentation, developer diagnostics, package scripts and CI reference checks; they do not change financial application behavior.

## Actual checks and outcomes

| Check | Actual outcome |
| --- | --- |
| Fresh npm ci with dev/optional dependencies and --prefer-offline | Passed; 682 packages installed into a new node_modules directory. No existing node_modules was copied. |
| Automated suite in existing workspace and again after clean installation | 34 tests passed in each environment. |
| TypeScript check | Passed in existing and isolated environments. |
| Production build in isolated copy | Passed; generated dist/server/wrangler.json and all current routes. |
| Fresh database initialization | All seven SQL files executed once, in documented order, using local Wrangler DB/config/persistence flags. |
| Diagnostic after fresh initialization | Zero failures and zero warnings for the selected dependency/profile/schema markers. |
| Tier 1 live HTTP cycle | Passed: distinct tier gate, savings, witnessed decisions, repayments, supported correction, share-out, closing counts and retry safety. Synthetic share-out was UGX 59,900; emergency carry was UGX 2,000. |
| Tier 2 live HTTP workflow | Passed: approval without posting, savings holds, payout, repayment settlement, withdrawal, balanced journal and replay safety. |
| Tier 3 live HTTP workflow | Passed the digital checks plus analysis gating. |
| Local snapshot exercise on isolated data | Selected counts and tenant/account balances matched; printed integrity_check was ok. Counts included 4 organizations, 26 transactions and 58 entries. This remains a local database-only drill. |
| Final documentation validation | 20 Markdown files, 93 local links, 17 implementation paths and seven migration references checked; zero failures. Final diff formatting check passed. |
| Broken documentation link fixture | New docs:check command exited unsuccessfully and identified the missing file, as intended. Fixture removed. |
| Invalid execution-profile fixture | New doctor command exited unsuccessfully and identified the invalid profile, as intended. Fixture removed. |

The isolated server used http://127.0.0.1:5174 to avoid the user's existing server. Only the base URL was substituted in scratch copies of the existing HTTP exercise scripts; request logic was unchanged. Delivered exercise scripts still target 5173, as explicitly documented. The temporary verification server was stopped after the exercises. Synthetic runtime data and the local evidence summary stay under ignored work directories.

## Handoff provided

- [Contributor checklist](../CONTRIBUTING.md), [engineering rules](../AGENTS.md) and [developer handbook](DEVELOPER-HANDBOOK.md).
- [Setup troubleshooting](TROUBLESHOOTING.md), [API payload/state reference](API.md), [data dictionary](DATA-DICTIONARY.md) and [operations/release runbook](OPERATIONS.md).
- [PR template](../.github/pull_request_template.md) requiring actual test/review/data-impact evidence.
- `npm run doctor`: read-only dependency, profile, binding and selected local schema diagnostics.
- `npm run docs:check`: local inline-link existence, selected implementation paths, required package scripts and README migration sequence validation. It is configured in the CI workflow.

## Warnings and limitations

Installation emitted dependency-deprecation and pending-install-script warnings. No global package approval policy was weakened to suppress them. The actual build and local Worker execution succeeded in this environment. Developers must still follow their workstation/package-script policy; warnings and remedies are described in troubleshooting.

This verification did not perform an authenticated remote git clone, confirm remote push/CI, execute on Linux/macOS, test all browsers/accessibility states, authenticate different real users, integrate payments, restore hosted D1/R2 or obtain independent accounting/security acceptance. It cannot guarantee that no other machine will encounter a problem.

The original documentation audit remains a dated snapshot. This record supplies new onboarding evidence, not commercial acceptance. Update [current readiness](../TRIAL-STATUS.md) and retain the exact released revision/results when these changes are committed and reviewed.

## Later role-boundary change

The evidence above predates migration 0007, the separate platform_admin/organization_admin roles and AQODH_TEST_PORT. Those historical seven-file setup and fixed-port details are not current setup instructions. Follow README and [ROLE-SEPARATION.md](ROLE-SEPARATION.md) for eight migrations, separate role previews and current permission evidence.
