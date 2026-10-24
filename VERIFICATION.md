# Verification evidence and limitations

Initial documentation audit: 24 October 2026. The historical record below organizes previous implementation evidence and does not represent independent review. A subsequent [onboarding verification](docs/ONBOARDING-VERIFICATION.md) on the same date freshly reran tests/type checking, built an isolated clean installation, applied all seven migrations, exercised all three editions over local HTTP and checked local recovery. Consult that record for current environment and limitations. The previous document was dated 23 October 2026. Raw logs and screenshots from every historical check are not all retained in the repository.

## Recorded local evidence

| Check | Recorded result | Reproduction source | Scope limitation |
| --- | --- | --- | --- |
| Automated suite | 34 tests passed: 26 prior tests plus 8 digital tests. | npm test; tests/ | Synthetic/in-memory fixtures; not hosted identity or load testing. Count can change with later code. |
| TypeScript | Passed. | npm run check | Type correctness is not financial acceptance. |
| Production build | Passed. | npm run build | Artifact creation does not deploy or verify runtime authentication. |
| Tier 1 HTTP cycle | Passed. | scripts/tier-one-cycle-test.mjs | Uses local mocked identity and creates synthetic money records. |
| Tier 2 and Tier 3 HTTP workflows | Passed for each edition. | scripts/digital-trial-test.mjs | Owner/local identity exercises; separate-role behavior is tested in service fixtures. |
| Browser checks | Selected registration, navigation, Tier 1 draft controls, digital savings forms, Tier 3 layout and explanation selection inspected. | Prior implementation-session observations; no committed browser runner. | Not a full accessibility, browser/device matrix or customer acceptance test. |
| Local database recovery | Snapshot/count/balance comparison and integrity check previously reported successful. | scripts/recovery-drill.mjs | Local D1 SQLite only; no R2 evidence or hosted recovery guarantee. |
| GitHub CI | Workflow defined. | .github/workflows/verify.yml | No successful remote run is claimed here. |

## Tier 1 worked example

The local cycle exercise uses three synthetic members and records savings, separate emergency contributions, group loan approval/rejection, disbursement, repayment, a reversed fine, a fine received, an expense and an emergency payout. It rejects over-reserved loans, emergency overdraw and an incorrect closing count.

The recorded outcome distributed UGX 59,900 by savings weight, retained UGX 2,000 emergency cash and cleared cycle savings and loan principal. Closure rejected new entries while preserving idempotent replay. Registration rejected multiple tiers; digital organizations could not use meeting operations.

The practice-meeting browser check saved, restored and cleared an unposted device draft. It did not verify fully offline reload or background synchronization.

## Digital evidence coverage

Service tests in tests/digital.test.mjs cover member scoping and forged-member input, revocation, staff role separation, foreign-organization record denial, request versus confirmation, duplicate confirmation references and request keys, restricted share capital, savings holds, concurrent withdrawals, policy snapshots, liquidity fallback, disbursement, settlement and Tier 3 review notes without ledger changes.

The local HTTP exercise confirms automatic approval without an approval-time posting, denied withdrawals above available savings, separate payout, exact settlement, replay safety, balanced journals, paid withdrawal status and Tier 3 analysis gating. It does not authenticate different real people.

## Not yet established

- Real separate-user sign-in, trusted production ingress and MFA behavior.
- Independent accounting/security approval or legal/compliance acceptance.
- Payment-provider authenticity, delivery, reconciliation and external messaging.
- Customer opening-balance/loan migration and accepted exception handling.
- Digital corrections, restructuring, write-offs or additional interest products.
- Hosted deployment, full D1/R2 recovery, monitoring and recovery targets.
- Measured concurrent production capacity or full offline synchronization.

## Evidence required for the next release

Record the source revision, date/time and timezone, environment, commands, actual output/result, side effects, reviewer and unresolved findings. Link retained logs or CI runs when available, excluding credentials/customer data. Do not replace historical results with a new green claim unless checks were actually rerun. For documentation-only work, validate references, commands against source and diff consistency; application tests need not run.

## Role separation verification

The later role change adds migration 0007 and eleven permission-boundary tests, bringing the suite to 45 passing tests. Type checking and the production build pass. Platform denial checks and all three organization workflows pass in separate local role previews; selected browser checks confirm the UI boundary. See [ROLE-SEPARATION.md](docs/ROLE-SEPARATION.md) for the current permissions and review status. No authentication feature, merge or deployment is claimed.
