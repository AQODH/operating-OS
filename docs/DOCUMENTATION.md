# Documentation ownership and maintenance

Reviewed: 24 October 2026. This index is the team's navigation and maintenance contract. Named people have not been assigned to the role titles below; the project lead must make those assignments in the task tracker.

## Authoritative sources

| Document | Purpose / accountable role | Update trigger |
| --- | --- | --- |
| [AGENTS.md](../AGENTS.md) | Engineering rules, collaboration and review policy / Project lead. | Team conventions, security requirements or verification policy changes. |
| [README.md](../README.md) | Onboarding, setup and safe command entry points / Developer-experience owner. | Runtime, dependency, setup, script or migration sequence changes. |
| [TRIAL-STATUS.md](../TRIAL-STATUS.md) | Current implementation, readiness and unresolved acceptance / Project lead. | Capability delivered, gap discovered, gate accepted or release state changed. |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Implemented boundaries, data flow and calculation contracts / Technical lead. | Auth, schema, posting, tier, interface or calculation behavior changes. |
| [BUILD-PLAN.md](../BUILD-PLAN.md) | Prioritized remaining work, role ownership, dependencies and acceptance / Delivery lead. | Scope, staffing, dependencies or acceptance decisions change. |
| [VERIFICATION.md](../VERIFICATION.md) | Recorded check results, reproduction sources and evidence limits / QA lead. | A check actually runs, a claim is invalidated or verification coverage changes. |
| [TIER-ONE-GUIDE.md](../TIER-ONE-GUIDE.md) | Group workflow and operational limits / Tier 1 domain owner. | Meeting, cycle, correction or group lending behavior changes. |
| [TIER-TWO-THREE-GUIDE.md](../TIER-TWO-THREE-GUIDE.md) | Digital account/lending/analysis behavior / Digital finance domain owner. | Member access, confirmation, policy, loan or analysis behavior changes. |
| [PLATFORM-REFERENCE.md](PLATFORM-REFERENCE.md) | Archived starter context / Platform maintainer. | Add clarification when confusing it with current product instructions; do not treat its original content as a current requirement. |
| [Documentation audit](DOCUMENTATION-REVIEW.md) | Snapshot of findings and corrections from this review / Review author. | Append a new review record when another full audit occurs; do not turn the snapshot into live status. |
| [Vendor license](../vendor/shadcn-tailwind-4.13.0.LICENSE.md) | Third-party attribution / Dependency maintainer. | Verify provenance if replacing the vendored dependency; preserve required notices. This is not AQODH's project-wide license. |

## Developer execution references

| Reference | Accountable role / update trigger |
| --- | --- |
| [Role separation](ROLE-SEPARATION.md) | Security/technical lead / server permission boundaries, administrator responsibilities and local role fixtures. |
| [Onboarding verification](ONBOARDING-VERIFICATION.md) | QA/developer-experience owner / new clean-install or runtime evidence; retain dated results. |
| [Contributing](../CONTRIBUTING.md) | Project lead / contributor workflow and review entry points. |
| [Developer handbook](DEVELOPER-HANDBOOK.md) | Developer-experience owner / setup, runtime or onboarding changes. |
| [Troubleshooting](TROUBLESHOOTING.md) | Platform maintainer / confirmed failure and safe resolution. |
| [API contract](API.md) | Backend lead / action payload, role, response or state changes. |
| [Data dictionary](DATA-DICTIONARY.md) | Database/domain owner / schema, record kind, account or integrity changes. |
| [Operations runbook](OPERATIONS.md) | Operations/release lead / migration, backup, incident or release process changes. |
| [Pull request template](../.github/pull_request_template.md) | Project lead / required review evidence changes. |

## Handling contradictions

Source and tests establish implemented behavior; AGENTS.md establishes expected practice; TRIAL-STATUS.md establishes the recorded readiness decision. If they disagree, investigate the gap rather than treating a policy or historical result as proof of implementation. Keep executable behavior changes separate from documentation-only corrections unless explicitly included in scope.

Update the authoritative source first, then related guides and onboarding references. Avoid contradictory appendices that leave old claims intact. Product scope and acceptance decisions belong in a focused decision record with owner, date, alternatives, consequences and evidence links; do not rely on chat history as the only record.

## Required detail for useful documentation

- Identify the intended reader, environment and whether statements describe policy, implementation, historical evidence or future work.
- Give exact commands/paths for reproducible setup and verification, including side effects and prerequisites.
- Give formulas, units, rounding and status transitions when documenting money.
- State who owns a decision and what evidence closes a delivery item. Do not invent names, approvals, timelines or completed work.
- Mark synthetic examples and distinguish them from customer data.
- Distinguish source publication, application deployment and commercial acceptance.
- Record evidence dates and source revisions when available. Mark missing raw artifacts and checks not rerun.
- Keep secrets, customer records and runtime state out of Markdown.

## Review checklist

Check relative links and source paths, verify npm commands against package.json, confirm migration filenames/order, scan for outdated availability/test claims, and inspect the diff. Documentation-only review does not require unrelated application tests. Do not edit third-party license text for stylistic consistency.


Run `npm run docs:check` before submitting documentation changes; it is also declared in CI. The script checks local paths/links, selected source references, declared npm scripts and README migration sequence. It does not prove external links, all code references or semantic accuracy. Run `npm run doctor` for read-only environment diagnostics; missing build/database before first setup is expected, not commercial acceptance evidence.
