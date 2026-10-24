# AQODH Organization OS

Working local software for a supervised financial and governance trial. Read TRIAL-STATUS.md for implemented features and material gaps. ARCHITECTURE.md explains organization isolation. VERIFICATION.md records completed checks.

## Start the existing workspace
Run Start-AQODH.ps1, or `npm run dev`. Open http://127.0.0.1:5173/. Use only synthetic records until the remaining trial gates are met. Local sign-in uses the starter’s development identity.

## Set up a fresh checkout
Use Node.js 24 and install with `npm ci`. Build with `npm run build` to generate the local database configuration.

Apply these migration files in order with the command below, replacing FILE with each filename. Apply each only once: 0000_lethal_namorita.sql, 0001_calm_wraith.sql, 0002_financial_guards.sql, 0003_ledger_controls.sql, 0004_tenant_indexes.sql, 0005_ledger_safe_range.sql, 0006_organization_tiers_meetings.sql.

```
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/FILE
```

Then run `npm run dev`. Do not replay migrations on an existing database. The development workspace already has all seven migrations applied.

## Checks
- `npm test`: financial, authorization, database and tenant-isolation tests.
- `npm run check`: TypeScript check.
- `npm run build`: production build.
- `node scripts/tier-one-cycle-test.mjs`: complete local Tier 1 cycle, one-tier registration and edition-boundary checks.
- `node scripts/recovery-drill.mjs`: local database snapshot/restore verification; does not back up hosted storage or evidence files.

HTTP tests create clearly named QA organizations containing synthetic records. They are not customer data. No payment or external message is sent.

## Development rules
Financial calculations use integer UGX and explicit rounding. Posted entries are immutable; supported corrections are reversals. Every data/file endpoint authorizes the selected organization. Applied migrations are immutable. Do not merge financial changes without meaningful tests and a second reviewer. No independent human review is claimed for this build.

## Hosting
The existing Site ID is preserved in .openai/hosting.json. Hosting remains owner-private. Automatic approval review blocked issuance of the repository write credential; publication has not occurred. Do not create a replacement Site or bypass that rejection. A separate deployment/audience decision is needed before real multi-user access.

## Tier 1
See TIER-ONE-GUIDE.md for the current meeting-based workflow and its supported rules. Tier 2/3 registrations are in-development reservations, not combined access.

## Digital editions added

Tier 2 and Tier 3 now run locally. Read [TIER-TWO-THREE-GUIDE.md](TIER-TWO-THREE-GUIDE.md) for member account access, deposit/withdrawal confirmation, lending policy, analysis, verification and trial limitations. The earlier Tier-1-only statements in historical notes are superseded by TRIAL-STATUS.md. No new database migration is required: digital workflows use tenant-scoped versioned records and the existing sealed ledger.
