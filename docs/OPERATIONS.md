# Operations and release runbook

Audience: release owner, operations lead and reviewer. This is an actionable handoff framework for the existing local trial, not a claim that production operations are established. Named responders, recovery time/point targets, retention periods and approved customer environment are not yet assigned.

## Environment and release record

Before a release, record the environment owner, source revision, target audience, supported edition/products, applicable trial gates, check results, independent finance/security reviews, migration plan, backup/recovery evidence, monitoring and rollback/forward-repair decision. Use [BUILD-PLAN.md](../BUILD-PLAN.md) to assign missing owners. Do not deploy merely because a build or source push succeeded.

## Local database initialization

Use README's exact binding/config/persistence flags. Check existing schema and deployment history before each manual SQL execution. The eight files are not automatically safe to replay. On a fresh database, verify all required tables, organizations.tier and integrity triggers after the chain; doctor checks only selected markers, not full schema equivalence.

If an execution partially fails, stop, preserve the error and inspect actual schema with the database owner. Do not assume the file was fully applied or roll it back by dropping tables. Applied migration changes require a forward repair or planned restore, not editing history.

## Local snapshot exercise

1. Confirm this is a synthetic development database and identify the actual checkout/config and selected state database. Do not assume a database exported from another default persistence path is the active one.
2. Create ignored work/ if absent: PowerShell `New-Item -ItemType Directory -Force work`; POSIX `mkdir -p work`.
3. Run `node scripts/recovery-drill.mjs`.
4. Record the result, snapshot location and errors. The script uses Node SQLite backup, compares selected table counts and tenant/account balances, and prints integrity status.
5. Independently inspect what was covered. The script does not assert every integrity result or compare every record/body; it is not complete disaster-recovery proof. meeting_transactions, guards and the platform role/audit tables are not in its explicit count-comparison list, although a complete SQLite snapshot includes their tables.
6. Keep snapshots out of Git. A local snapshot without R2 files, credentials/access configuration and restore verification is not a full application backup.

The drill writes a new SQLite snapshot; it does not replace the live database. Its source selection uses a schema marker, so multiple candidate databases require manual confirmation.

## Hosted backup and restore — required design before acceptance

The operations lead must implement and verify a provider-supported export/snapshot process for D1 and R2, with access configuration, retention, encryption, restore permissions and agreed recovery targets. Never assume local SQLite copying is a hosted restore method.

Rehearse restoration into an isolated authorized environment. Verify expected schema/migrations, journal balance/seals, representative per-member balances, transaction/audit/meeting links, evidence downloads, tenant/member access and revocation. Record measured recovery time and lost-data window against agreed targets. Route discrepancies to finance/security owners before reopening writes. No full hosted procedure is currently verified.

## Deployment and source control

1. Inspect the working tree; preserve others' changes. Confirm the exact revision to release and permitted action (commit, push, merge, deploy).
2. Run required checks and obtain applicable independent review. Inspect CI output for the intended revision rather than inferring success from a workflow file.
3. Publish source through authorized GitHub credentials. If agent credential access fails, the authorized user can push from their normal terminal; do not share tokens. Confirm the remote branch points at the intended commit.
4. Resolve the recorded Sites publication blocker through authorized access. Preserve .openai/hosting.json identity and current audience; do not create a replacement Site to bypass review.
5. Deploy only through the supported release mechanism after reviewing required migration ordering and recovery. npm start is local preview, not deployment.
6. Verify the returned deployment identifier, target audience, trusted identity boundary and accepted critical workflows. Record success/failure and the actual user-facing URL only after verification.

## Incident response

For suspected integrity or unauthorized-access failures, pause the affected operation using the approved environment process; notify the named lead and preserve sanitized evidence. Determine affected organizations and source revision, assess confirmed financial records and follow an independently reviewed correction/recovery plan. Do not erase audit/ledger history, manufacture compensating money or claim recovery from a green health page alone.

For suspected credential exposure, use the credential owner's approved rotation/revocation process and record affected access. Do not paste the credential into incident documents. Production alerting, on-call routing and customer communication templates must be established before customer operations.

## Release handoff checklist

- Source/remote/deployment revisions agree, or discrepancies are documented.
- Migration state and journal reconciliation are accepted.
- Correct audience and organization/member permissions are verified.
- Payment connectivity is accurately described; manual confirmation remains explicit where integrations are absent.
- Backup/restore, incident owner, monitoring and recovery targets are accepted.
- User-facing limitations and trial scope are current.
- Customer and specialist acceptance is recorded; no self-review substituted for independent sign-off.
