# Developer handbook

Audience: a developer joining AQODH or handing work to another developer. Read [AGENTS.md](../AGENTS.md), [current status](../TRIAL-STATUS.md) and [README](../README.md) first. This guide supplies operational detail, not commercial acceptance.

## First-day checklist

1. Clone the repository into a dedicated folder; record branch and `git status --short`. Never develop against a customer checkout/database.
2. Use Node 24 and the committed npm lockfile. Run `npm ci`; do not overlap installations or install only production dependencies for development.
3. Run `npm run doctor`. Missing generated config/database is expected before fresh initialization; missing dependencies or an invalid profile must be resolved.
4. Follow README build and one-time SQL migration steps. A source clone contains no runtime database, evidence files, sessions or installed dependencies.
5. Start `npm run dev` on loopback. Use its printed URL; visit `/signin-with-chatgpt?return_to=/` for portable local sign-in. Do not expose this development identity to a network.
6. Choose the local role preview in README: platform for the registration console, or organization in a separate local database for organization activities. Platform admins cannot enter organization operations. Tier 1 needs members and a cycle before a meeting; digital editions need members, lending rules and linked portal access before member trials.
7. Run `npm test`, `npm run check`, `npm run build` and `npm run docs:check`. Record the results and environment. Run the relevant HTTP exercises only on the designated synthetic local database.
8. Obtain a task brief with owner, reviewer, acceptance criteria and module ownership. Resolve ambiguous money rules before implementation.

Use `npm run doctor` again after initialization. A green diagnostic only checks prerequisites and selected schema markers. It is not a security or accounting verdict.

## Local versus built versus hosted runtime

| Mode | Start | Identity and storage expectations |
| --- | --- | --- |
| Portable development | npm run dev | HMR; default port 5173; loopback mock sign-in; local DB/BUCKET simulation. |
| Built local preview | npm run build, then npm start | Wrangler prints a possibly different port and shares local state. Does not supply portable mock sign-in; login-dependent HTTP scripts are not a built-preview acceptance test. |
| Managed platform development | Environment-owned workflow | Local profile may be managed-linux with a supervisor and no portable mock identity. Do not replace that profile arbitrarily. |
| Hosted | Authorized release workflow | Trusted identity ingress, hosting audience and application membership must all be verified. npm start does not deploy. |

A clean clone defaults to portable when the ignored profile file is absent. Do not copy another developer's .sites-runtime, .wrangler or credentials to make setup work.

## Configuration map

| Item | Purpose | Handling |
| --- | --- | --- |
| .openai/hosting.json | Site identity and DB/BUCKET binding names. | Tracked; preserve existing identity. IDs are configuration, not access credentials. |
| vite.config.ts | Local binding simulation, plugins and execution-profile behavior. | Tracked. A placeholder D1 ID is for local simulation, not a customer database. |
| .sites-runtime/execution-profile.json | Local profile selection. | Ignored; do not distribute another workstation's file. |
| .wrangler/state | Local D1/R2 runtime state. | Ignored; contains persistent data. Never erase it as a routine fix. |
| dist/server/wrangler.json | Generated built Worker configuration. | Ignored; rebuild when bindings/source configuration change. |
| .env* / .dev.vars* | Possible future local secret configuration. | Ignored. No application secrets file is currently required for portable mock development; do not invent keys or copy credentials. |
| work/ | Synthetic snapshots and scratch evidence. | Ignored; create before scripts that require it. No customer exports. |

Tool defaults in scripts/tool-environment.mjs disable CF metadata fetch and usage metrics, and keep runtime logs/registry local. SITES_RUNTIME_ROOT can relocate tool runtime paths; it does not by itself relocate the database. CLOUDFLARE_CF_FETCH_ENABLED and WRANGLER_SEND_METRICS enable optional external behavior when explicitly set. Do not print the whole environment while diagnosing a problem.

## Working on a feature

- Trace the active page/API import path. The retained generic prototype is not the live entry.
- Write a concrete before/after example and acceptance checks. For money include units, rounding, state and roles; for reads include allowed and denied visibility.
- Agree interfaces before concurrent work. Keep one owner per overlapping file or use separate worktrees.
- Implement focused changes. Add migrations rather than editing applied SQL; read generated SQL before applying it anywhere.
- Run targeted checks first, then the required shared checks. Explain a baseline failure rather than removing a test.
- Update the authoritative documentation and submit the review record in the pull request. Do not include raw customer data or credentials as evidence.

## Tests and side effects

Automated tests use synthetic SQLite fixtures and do not require the web server. HTTP exercises and create-practice-group.mjs operate on persistent local state and create organizations/records. They do not clean up afterward. Workflow scripts default to http://127.0.0.1:5173; AQODH_TEST_PORT selects another loopback port. Organization workflow checks use a local-only metadata fixture helper that refuses platform identities; platform-boundary-test.mjs checks the separate platform preview. Do not start a duplicate server or redirect the scripts to production.

The recovery drill chooses a local database by its schema and writes a snapshot under work/. Confirm the correct runtime database first, especially if multiple candidates exist. The drill is not a full backup manager and does not restore R2. See [operations runbook](OPERATIONS.md).

## Pull request handoff

Use [the PR template](../.github/pull_request_template.md). Include exact checks/result, source/environment, independent review status and remaining limitations. Financial or authorization work cannot be merged on self-review alone. Commit, remote push, CI, deployment and customer acceptance are distinct evidence points.

Use [troubleshooting](TROUBLESHOOTING.md) for known setup failures, [API contract](API.md) for requests and [data dictionary](DATA-DICTIONARY.md) for storage. Never interpret documentation as permission to access real systems or bypass a review rejection.

See [ROLE-SEPARATION.md](ROLE-SEPARATION.md) for platform_admin versus organization_admin. This role change adds no authentication or impersonation feature.
