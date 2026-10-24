# Troubleshooting local development

Use this guide from the repository root. Start with `node --version`, `npm run doctor` and `git status --short`. Share sanitized errors and the failing command; never paste credentials, a complete environment dump or customer records.

| Symptom | Check and safe next action |
| --- | --- |
| npm launcher cannot locate npm-prefix.js / npm-cli.js on Windows | Use README's Node-to-npm-cli PowerShell fallback. Do not reinstall unrelated global tooling or change HOME. |
| Module not found / vinext absent | Confirm root and Node 24, finish one npm ci, and rerun doctor. Include dev/optional dependencies. Installation requires registry access or a complete cache. |
| Install fails with network/registry access | Record the sanitized host/status; request legitimate network access or use the organization's approved registry. Do not replace the lockfile with unreviewed versions. |
| npm warns about pending install scripts | Record the affected packages and follow the team's approved package-script policy. A warning does not by itself prove failure; verify the build/native tools. Do not broadly approve all scripts or weaken workstation policy to silence it. |
| Missing dist/server/wrangler.json | Run npm run build successfully before standalone Wrangler migration/start commands. |
| Missing organizations table or tier column | Inspect which local database/config is selected and which migrations were applied. Apply only confirmed pending migrations; do not rerun all SQL or delete state. |
| Table already exists / duplicate tier column | Stop migration execution; reconcile migration history and schema. Manual SQL setup is not automatically idempotent. Escalate uncertainty to the database owner. |
| Wrangler sees an empty database although the app has records | Confirm --config dist/server/wrangler.json and --persist-to .wrangler/state from the same checkout. Some commands have different persistence support; do not infer recovery success from an empty export. |
| Server already running / port 5173 occupied | Reuse the intended server or identify its owner. Do not kill arbitrary processes. HTTP exercises default to 5173; set AQODH_TEST_PORT to the intended loopback port. |
| Repeated sign-in redirect in built preview | npm start does not supply development mock identity. Use portable npm run dev for synthetic login, or validate supported trusted hosted ingress. Do not forge headers on a publicly exposed server. |
| Signed in but organization denied | Check hosting visitor access separately from organization membership; confirm exact linked email, member record and tier. Do not grant a wider staff role to hide a member-scoping issue. |
| Platform user cannot enter an organization | Intended behavior, including legacy owner/membership rows. Use a separate organization-preview database; do not remove role checks or demote the platform identity to bypass them. |
| Organization role fixture refuses the database | The local identity is already a platform admin. Use a separate fresh local database for organization workflow evaluation. The fixture does not remove or weaken existing roles. |
| Loan needs another reviewer | Manual decision cannot be made by its original requester. Use a genuinely different authorized identity in the target environment; local service fixtures do not establish that identity setup. |
| Request changed / guard constraint conflict | Reload organization state and recalculate; a concurrent mutation may have consumed savings/cash. Preserve the same key and exact payload for replay of a completed request. Use a new key for a deliberately revised request. |
| Receipt reference already used | Check the original confirmation and request; do not add a random suffix to defeat duplicate detection. Resolve the actual receipt evidence with the treasurer. |
| Withdrawal or payout refused | Check confirmed savings, pending withdrawals, active loan holds, approved loans and reserve policy. A pending request is not confirmed money. |
| Cash counts do not match / meeting cannot close | Recount both funds and inspect that meeting's entries. Use only supported audited corrections; never update entries directly. |
| npm run check fails in a scratch folder | Keep temporary TypeScript under ignored work/ or fix the intended source. Do not expand tsconfig exclusions to hide real errors. |
| Recovery script cannot find work/ | Create the ignored work directory, confirm local state, then rerun. A snapshot is not proof of hosted recovery. |
| gh reports signed out / Git credential-manager access denied | Authenticate in the user's normal approved terminal. The restricted agent may not access Windows Credential Manager. Run authorized push there if needed; never paste a token into chat or commit a credential. |
| Push rejected as non-fast-forward | Fetch and inspect remote history after authentication. Coordinate a normal integration; do not force-push to replace others' work. |
| Sites publication credential rejected | Preserve the concrete blocker and obtain authorized resolution. GitHub upload is not a substitute deployment, and a replacement Site is not a permitted workaround. |
| docs:check reports a missing target | Fix the source link/path or restore the intended document. The checker validates local files, not external websites or semantic correctness. |

Escalation record: command, Node/OS, checkout revision, affected mode, sanitized error, attempted safe steps, data side effects, expected behavior and owner needed. Do not classify an unresolved authentication, financial or migration failure as a successful release.
