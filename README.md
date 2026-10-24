# AQODH Organization OS

AQODH is a multi-tenant community finance application for supervised local evaluation. It has three editions; each organization is assigned exactly one. It is not yet accepted for a commercial trial with customer funds.

| Edition | Implemented local workflow | Guide |
| --- | --- | --- |
| Tier 1 — Community Groups | Meetings, savings shares, group lending, separate emergency funds and cycle share-out. | [Tier 1 guide](TIER-ONE-GUIDE.md) |
| Tier 2 — Digital SACCO | Individual accounts, receipt confirmation, withdrawal requests and configurable lending. | [Digital editions guide](TIER-TWO-THREE-GUIDE.md) |
| Tier 3 — Intelligent Finance | Digital workflows plus deterministic analysis, scenarios and review notes. | [Digital editions guide](TIER-TWO-THREE-GUIDE.md) |

No payment provider, external messaging service or external language model is connected. The application records staff-confirmed transactions; it does not transfer money.

## New developer handoff

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution checklist. Start with the [developer handbook](docs/DEVELOPER-HANDBOOK.md), [troubleshooting guide](docs/TROUBLESHOOTING.md), [internal API contract](docs/API.md), [data dictionary](docs/DATA-DICTIONARY.md) and [operations runbook](docs/OPERATIONS.md). Use the [pull request template](.github/pull_request_template.md) for review evidence. These references state unsupported behavior explicitly; they do not replace finance/security acceptance.

The [onboarding verification record](docs/ONBOARDING-VERIFICATION.md) documents a successful isolated Windows installation, fresh database initialization, build and all three edition exercises. Other operating systems, real hosted identities and commercial acceptance still need their own evidence.

## Developer entry points

Read [AGENTS.md](AGENTS.md) before changing code. [Documentation ownership](docs/DOCUMENTATION.md) identifies the authoritative source for each subject. [Current status](TRIAL-STATUS.md) records readiness, [architecture](ARCHITECTURE.md) explains implementation boundaries, [delivery plan](BUILD-PLAN.md) assigns remaining work to accountable roles, and [verification](VERIFICATION.md) distinguishes historical evidence from unverified claims.

Runtime: React/TypeScript with Vinext on the Cloudflare Worker model, D1 storage, Drizzle migrations and private R2 evidence storage. Use Node.js 24 for development and CI. The package engine minimum is broader; the documented test environment is Node 24.

## Start an existing configured checkout

From the repository root:

```sh
npm run dev
```

On Windows, `./Start-AQODH.ps1` starts the same development server and installs dependencies if absent. It does not initialize a fresh database. Reuse an already-running server rather than starting a duplicate. The default address is http://127.0.0.1:5173/; use the actual printed address if the port changes.

Portable loopback development uses a mock identity through `/signin-with-chatgpt?return_to=/`. This does not test real separate-user authentication. Keep development previews on loopback and use synthetic records.

## Set up a fresh checkout

1. Install Node.js 24 and run `npm ci` from the repository root.
2. Run `npm run build` to generate `dist/server/wrangler.json`.
3. Apply each pending SQL migration below in order, once only, to the local development database.
4. Choose a local role preview below, then run `npm run dev`. Use the existing portable development identity; no new authentication is being introduced.

Migration order:

- `0000_lethal_namorita.sql`
- `0001_calm_wraith.sql`
- `0002_financial_guards.sql`
- `0003_ledger_controls.sql`
- `0004_tenant_indexes.sql`
- `0005_ledger_safe_range.sql`
- `0006_organization_tiers_meetings.sql`
- `0007_platform_role_separation.sql`

For each pending filename, replace `FILE.sql` in this command:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/FILE.sql
```

This manual setup does not maintain a separate applied-migration registry. Confirm the database's migration history before execution. Do not replay scripts or reset existing data to resolve uncertainty. The original development checkout has these migrations applied; a new clone does not include that database. No additional schema migration was needed for the digital edition implementation.

If the Windows npm launcher fails to locate its CLI, use the installed Node distribution directly:

```powershell
$npmCli = Join-Path (Split-Path -Parent (Get-Command node).Source) 'node_modules\npm\bin\npm-cli.js'
node $npmCli ci
node $npmCli run build
```

## Separate role previews

Read [the role separation decision](docs/ROLE-SEPARATION.md). Platform admins cannot enter organization operations, even if legacy data calls them owner. Organization admins have the canonical role organization_admin. Application role assignment is separate from the existing identity stub; real authentication remains deferred.

After migration 0007, choose a role for this checkout’s synthetic local database:

```sh
node scripts/seed-local-roles.mjs platform
```

This opens the platform directory, organization registration and administrator assignment. New organizations need a different non-platform organization administrator email. Platform users see no member or financial data and cannot impersonate that account.

For organization workflow evaluation, use a separate fresh checkout/database and:

```sh
node scripts/seed-local-roles.mjs organization
```

That prepares organization-admin access for the local mock identity. It refuses to run where the same identity is already a platform administrator. Do not delete role rows, copy another database or create a UI bypass to switch roles. No new identity-selection/authentication feature is supplied.

## Checks

| Command | Scope and side effects |
| --- | --- |
| `npm run doctor` | Read-only prerequisite/profile/local-schema diagnostic; no network or money writes. Does not certify full schema, authentication or readiness. |
| `npm run docs:check` | Validates local document links, implementation paths, npm script existence and README migration ordering. External links and semantic truth still require review. |
| `npm test` | Automated domain, finance, database, role and tenant tests; uses synthetic fixtures. |
| `npm run check` | TypeScript check; no customer service calls. |
| `npm run build` | Production artifact build; does not deploy. |
| `node scripts/tier-one-cycle-test.mjs` | Requires organization-preview local server; prepares synthetic organization metadata and Tier 1 financial records. |
| `node scripts/digital-trial-test.mjs` | Requires organization-preview server; creates synthetic Tier 2/3 financial records. |
| `node scripts/platform-boundary-test.mjs` | Requires platform-preview server; verifies organization reads, writes, meetings and files are denied. |
| `node scripts/recovery-drill.mjs` | Reads local D1 state and writes a SQLite snapshot under ignored work/. Does not recover R2 or a hosted deployment. |

HTTP exercises default to loopback port 5173. Set AQODH_TEST_PORT to a different local port when using an isolated checkout (PowerShell: `$env:AQODH_TEST_PORT='5174'`; POSIX: `AQODH_TEST_PORT=5174 node scripts/digital-trial-test.mjs`). The fixture helper hard-codes local Wrangler state and refuses platform-user workflow fixtures. Before the recovery drill, ensure `work/` exists. Never point HTTP exercises at a customer environment. The GitHub workflow declares install, documentation validation, tests, type checking and build; the presence of that workflow does not prove a remote run passed.

## Source, runtime state and publication

Commit source, migration history, tests, documentation and required third-party license notices. Exclude credentials, local databases, dependencies, generated builds, session state and exports as defined in `.gitignore`.

The configured GitHub destination is https://github.com/ripeestech/operating-OS. A local commit is not evidence that it reached the remote. Verify a successful push separately.

`.openai/hosting.json` retains the existing Sites identity and DB/BUCKET bindings. The last recorded hosting audience was owner-private. Hosted publication was blocked by automatic approval review rejecting Sites source-repository credential creation. GitHub publishing has separately encountered local credential-access failures. Neither is evidence of a successful deployment, and neither should be bypassed. An authorized release must verify the then-current access and hosting state.

See [trial acceptance gaps](TRIAL-STATUS.md) before using real identities or customer balances.
