# Internal API contract

Audience: frontend/backend developers. This describes the current unversioned application API, not a public banking integration or a stable external SDK. Check the route and service source when changing it; update this document and tests together.

## Common request rules

- Identity is resolved server-side using the supported trusted hosting ingress or portable development mock flow. Do not embed identity tokens or forge identity headers in clients.
- Select the organization through `?tenant=<organization-id>` except organization directory/registration requests.
- JSON POSTs require Content-Type application/json and an Origin matching the request URL's origin. File upload uses multipart/form-data with the same origin requirement.
- Role, edition, member ownership and source-record tenant are checked on the server. IDs from another organization must fail.
- Financial amounts are integer UGX; annualRate is integer basis points (1200 = 12%). Monthly terms and ISO dates are explicit. General text limits are enforced in source; digital bodies are limited to 20,000 serialized characters and keys to 100 characters.
- Business failures generally return JSON `{ "error": "message" }`. Workspace POST uses 400; workspace GET uses 403. Meeting POST and attachment POST use 400; attachment GET uses 403. These codes currently conflate several failure categories; do not assume separate stable error codes, 401/404/409 contracts or an implemented public error taxonomy.
- Digital actions require a nonempty key. Replay uses the same actor, key and identical serialized body, including field order. A mismatch is refused. Concurrent requests can fail a guard; reload before deciding whether to retry the same request or submit a revised one with a new key.

## Workspace reads

`GET /api/workspace` returns accessible organizations. `GET /api/workspace?tenant=...` returns authorized records, transactions, entries, role and applicable supplementary fields. Record data is parsed JSON. Staff audit history is limited to the most recent 200 rows; domain/ledger reads are currently unpaginated.

Digital organization-admin reads include memberships. Member reads exclude organization audit/membership/current-policy/analysis and include only their own member, digital loans and money requests plus corresponding transactions/entries. Own-loan policy snapshots are included. Staff/viewer Tier 3 reads include calculated insights; Tier 2 and member reads do not.

## Organization registration

Organization registration is no longer available through /api/workspace. Platform admins cannot access workspace reads or mutations.

GET /api/platform returns organization id/name/tier/created metadata, administrator contacts and platform history. POST /api/platform accepts registerOrganization (key, name, tier, administratorEmail) or assignAdministrator (key, organization, administratorEmail). The role must be platform_admin, Origin must match, and the administrator must be a separate non-platform email. Unknown fields are rejected. Identical command replay returns the previous result with duplicate=true; changed payloads cannot reuse a key. Current platform errors return 403. No public platform-role grant, impersonation or tier-reassignment endpoint exists. The existing identity adapter is retained; no authentication feature is added.

## Digital workspace mutations

All actions below use `POST /api/workspace?tenant=...` and include action and key. C = organization_admin/officer/treasurer; P = organization_admin/treasurer; A = organization_admin/officer. Platform admins have none of these rights. A digital member can submit only the supported own-account requests; their supplied member field is ignored in favor of the resolved link.

| Action | Required action fields, in addition to key | Permission / effect |
| --- | --- | --- |
| digitalMember | name; optional phone | C; creates member. |
| digitalPolicy | policy object | Organization admin; appends a new policy record. |
| digitalAccess | email, role; member when role is member | Organization admin; assigns member/officer/treasurer/viewer membership and member link. |
| digitalRevoke | email | Organization admin; removes membership. |
| depositRequest | amount, reference; member for staff; optional account=savings or share_capital | C or own member; pending request only. |
| withdrawalRequest | amount, reference; member for staff | C or own member; holds available savings; account forced to savings. |
| confirmDeposit | id, kind=deposit_request, reference | P; confirms received money; unique normalized confirmation reference. |
| payWithdrawal | id, kind=withdrawal_request, reference | P; records a completed external payout after checks. |
| declineRequest | id, kind=deposit_request or withdrawal_request, reference as reason | A; declines pending request and releases any withdrawal reservation. |
| digitalLoan | name, principal, months, purpose; member for staff | C or own member; creates submitted/approved request according to saved rules. |
| decideLoan | id, decision=approved or declined, reason | A; submitted loans only; rejects original requester as reviewer. |
| disburseLoan | id, reference | P; approved only; posts full principal and creates monthly schedule. |
| repayLoan | id, amount, reference | P; disbursed only; interest first, then principal; no overpayment. |
| digitalOpening | amount, reference | Organization admin; first ledger entry only, credits opening_equity. |
| reviewInsight | id of active flag, note | A, Tier 3 only; records review note without financial entry. |

Policy object fields and defaults: mode=manual, annualRate=1200, maxPrincipal=5000000, maxMonths=24, loanMultiple=2, autoLimit=100000, liquidityFloor=0. Allowed modes: manual, assisted, automatic. Policy validation permits maxMonths 1–60, loanMultiple 1–10, annualRate 0–100000 basis points, maxPrincipal 1–1000000000, autoLimit/liquidityFloor 0–1000000000. These are implementation limits, not recommended commercial terms.

Creation actions typically return id; digitalLoan also returns status. Other actions typically return ok. Repeated successful commands add duplicate=true to the original result. Read fresh server data rather than reconstructing a ledger from response shape alone.

### Digital state transitions

- Deposit: pending -> confirmed or declined. No partial confirmation/edit/reversal flow.
- Withdrawal: pending -> paid or declined. No partial payout or automatic expiry.
- Loan: submitted -> approved or declined; automatic evaluation can create approved directly. Approved -> disbursed -> settled. Repayments may leave disbursed until fully settled. No approved-loan cancellation or restructure endpoint.
- Policy changes affect future requests, not existing loan snapshots. Manual and assisted currently require the same human decision process.

## Tier 1 workspace mutations

Same workspace endpoint, Tier 1 only. Implemented actions: importMembers (csv, key); invite (email, role=officer/treasurer/viewer); revoke (email); create (kind member/loan/reconciliation, name, data); post; reverse. Permissions and record-specific validation are in app/api/workspace/route.ts. Generic approve/reject/guarantee actions are explicitly disabled; use meeting group-decision actions.

`post` requires type, positive integer amount, description and key. Supported types: opening, contribution, fine, socialContribution, socialPayout, groupExpense, disbursement, repayment. Non-opening entries require meeting; relevant member or loan source fields depend on type. Contributions must be whole multiples of the cycle share price. Opening is organization-admin-only and must precede other ledger entries.

`reverse` requires id of original transaction, meeting, reason and key. Only supported non-loan/non-share-out corrections in the same cycle are permitted. Do not treat this route as a digital correction API. See the route and Tier 1 exercise for complete source-specific payloads.

## Meeting mutations

`POST /api/meetings?tenant=...`, Tier 1 only. Do not assume digital-style command receipts for every meeting action.

| Action | Principal fields | Role / requirement |
| --- | --- | --- |
| createCycle | name, sharePrice, quorumPercent, loanMultiple, maxMonths, annualRate; optional meetingDay, maxPrincipal, openingAllocationReference | Organization admin; no active cycle or open meeting. |
| openMeeting | cycle, name, date, attendance[], counters[], openingCash, openingSocial | C; valid quorum, two distinct attending counters and ledger-matching counts. |
| closeMeeting | meeting, cash, social, counters[], minutes | P; open meeting, matching counts. |
| approveGroupLoan / rejectGroupLoan | meeting, loan, witnesses[], resolution | A; submitted same-cycle loan, two attending nonborrower witnesses. |
| shareOutPreview | meeting | P; cycle loans resolved; returns plan, cash, socialCarriedForward and version. |
| shareOut | meeting, cash, version, witnesses[], reference | P; matches latest preview and required witnesses. |

## Evidence files

`POST /api/attachments?tenant=...`: multipart fields file and source record ID. Create-capable staff only; nonempty PDF, PNG, JPEG or plain text up to 5 MB. Returns id. `GET /api/attachments?tenant=...&id=...` downloads same-tenant attachment after staff authorization. Digital members are denied. No public download link, member file portal, retention policy or full file backup/restore service is implemented.

## Change discipline

For any changed action, specify input/output/state compatibility, role/tier/member restrictions, journal effects, replay/concurrency behavior and failure cases in the PR. Preserve Origin checks and tenant gates. This document is a maintained human reference, not a generated OpenAPI guarantee; [source map](../AGENTS.md) and tests remain necessary.

Tenant invite/access/revoke actions reject known platform identities as assignees and cannot overwrite or revoke an existing organization_admin membership. Platform-assigned administration is distinct from tenant staff/member management.
