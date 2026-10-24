# Contributing to AQODH

Start with [AGENTS.md](AGENTS.md) and the [developer handbook](docs/DEVELOPER-HANDBOOK.md). The system is a supervised local trial; do not introduce customer data or assume production readiness.

## Before implementation

- Agree the task's scope, named owner/reviewer, acceptance criteria and affected edition.
- Inspect git status and preserve unrelated work. Coordinate file ownership before parallel edits.
- Confirm Node 24 and complete README setup. Run npm run doctor; a clean clone still needs the documented build and one-time migrations.
- Resolve financial rules with the domain reviewer and access changes with the security reviewer before coding ambiguous behavior.

## Before review

Run relevant tests, npm run check, npm run build and npm run docs:check. Run HTTP workflow exercises only against the designated synthetic local environment; they persist records. Follow [verification scope](VERIFICATION.md), not just a green command exit.

Use the [pull request template](.github/pull_request_template.md). State actual results, source/environment, side effects and checks not run. Update the relevant documents using [document ownership](docs/DOCUMENTATION.md).

Financial and authorization changes require independent review before merge. A coding agent's self-review is not independent approval. Keep migration/recovery and tenant/member regression evidence with the change.

## Boundaries

Never commit secrets, runtime databases, session state or customer exports. Do not edit applied migrations or posted money, remove tests to hide failures, force-push shared history or bypass approval rejection. Push, merge, deployment and commercial acceptance are separate actions with separate evidence requirements.

For setup problems see [troubleshooting](docs/TROUBLESHOOTING.md). For release or recovery work see [operations](docs/OPERATIONS.md). Public project licensing, named operational contacts and commercial approvals require owner decisions; third-party notices do not grant a project-wide license.
