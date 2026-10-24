# ADR: separate platform administration from organization operations

Status: implemented locally; independent security/finance review pending before merge. Implementer: Codex. Reviewer: not yet assigned. Authentication implementation is explicitly out of scope by the user's instruction; the existing development identity/provider adapter is retained unchanged.

## Problem and acceptance criteria

Previously, registration stored the current user in organizations.owner. The same account could register many organizations and then receive all operational owner permissions in each, conflating the system administrator with an organization's administrator.

The requested behavior is strict separation: a platform administrator can register organizations and assign their administrators, but cannot read their operational records or perform member, meeting, lending, money, policy, team or file activities. Organization administrators manage only organizations they are assigned. The server must enforce this even when old data still names the platform account as owner.

## Decision

- Store platform assignments in platform_roles, separately from memberships. The server resolves assignments by current identity ID or normalized email; browser role fields do not grant permissions.
- The canonical organization administrator role is organization_admin. Legacy organizations.owner relationships remain compatible for non-platform users, but a platform assignment is denied before the legacy owner check.
- A platform user cannot hold an effective organization role. This denial applies before all workspace reads/writes, meeting operations and evidence access. Digital mutations resolve access again before command receipt replay.
- The separate /api/platform control surface exposes registration metadata and platform history only, not members, journals, organization audit or analytics. It registers one tier and assigns a different non-platform administrator email. It cannot grant platform roles, impersonate an organization user or alter money.
- New organizations receive an unassigned owner marker and an explicit organization_admin membership; their creator does not become their operational owner.
- Platform actions have separate immutable audit receipts and replay checks. Organization transactions, entries and audit are not rewritten by the migration or role setup.
- No login, password, token, MFA, registration-authentication or identity-switching feature is added. This is role-based authorization on the existing identity stub/adapter, not proof of production identity security.

## Data and local setup

Migration 0007_platform_role_separation.sql adds platform_roles and platform_audit, including immutable platform-audit triggers. It does not delete or reassign existing organization financial data. Apply it once using the README flags. The database may contain old ownership or membership rows; the deny-first server rule is the protection, not cleanup of those records.

Role previews are explicit local-only fixtures:

- `node scripts/seed-local-roles.mjs platform` gives the existing synthetic portable identity platform-only permissions. Existing ownership does not let it enter organizations.
- `node scripts/seed-local-roles.mjs organization` prepares synthetic organization-admin memberships for the existing identity in a separate local database. It refuses a database where that identity already has a platform assignment. It does not remove or demote a platform account.

Use separate checkouts/databases to evaluate both roles. No UI role switch or organization impersonation is provided. These scripts are development fixtures with local Wrangler flags; they are not production authentication/bootstrap workflows.

Workflow exercises now prepare organization metadata with a local-only test helper rather than registering organizations as an operational user through the application. The helper refuses a platform identity and never posts money. AQODH_TEST_PORT selects a different loopback port when isolating checks.

## Verification and remaining review

Automated tests cover separate registration/administration, denial despite legacy owner/membership, forged role fields, direct digital-service context, directory scoping, administrator assignment restrictions, one-tier validation, replay safety, organization isolation and immutable platform audit. Existing financial tests remain required. Live checks must cover both role previews, all three organization workflows and platform denial at workspace, meetings and attachments. Browser checks must confirm platform controls do not expose organization navigation or operational actions.

This change must remain unmerged until a separate reviewer accepts the authorization boundary. Future real authentication and trusted identity ingress require their own design and acceptance; they are not implemented by this ADR.

## Recorded local outcome

The updated 45-test suite, TypeScript check and production build passed. Migration 0007 was applied to the local platform preview and the isolated organization preview. The platform HTTP check denied workspace reads, eight organization mutation types, meetings and evidence reads/writes, while returning only platform directory metadata. Organization-preview HTTP exercises passed for all three editions, including separate approval/disbursement, settlement, cash closing, share-out and retry behavior. These exercises used synthetic local data and the existing identity stub.

Browser inspection confirmed platform-only navigation on port 5173 and organization-admin member-management controls in the separate port-5174 preview, with organization registration removed from its navigation. Authentication helper and mock-auth plugin source were unchanged. This is not real authentication acceptance or independent review. The implementation remains uncommitted/unmerged, with reviewer assignment pending.

Tenant team-management actions also refuse to demote or revoke a platform-assigned organization_admin. This prevents an organization administrator from accidentally removing their own administrative access through a staff/member form. The interface labels those assignments as platform-assigned instead of offering a revoke action. There is no new platform administrator-removal workflow in this change.

Development-preview limitation: the isolated server logged a React multiple-renderer warning during hot reload. Selected role pages and HTTP checks remained usable; its cause was not isolated in this change. This is not a claim of clean production runtime logs or a completed browser/accessibility acceptance matrix.
