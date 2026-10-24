# AQODH — current implementation status

Tier 1, Tier 2 and Tier 3 have distinct local application workflows. Registration assigns exactly one tier to each organization. No reassignment endpoint is exposed. The shared entry shell selects app/tier-one-workspace.tsx or app/digital-workspace.tsx based on that assignment.

Tier 1: cycles, quorum, witnessed group decisions, meeting collections, separate emergency cash, loan repayments, closing counts and share-out. See TIER-ONE-GUIDE.md.

Tier 2: individual savings and restricted capital, member-scoped portal, deposit verification, withdrawal requests and savings holds, versioned lending policies, manual/assisted/automatic approvals, separate disbursement, repayment schedules and statements.

Tier 3: Tier 2 digital finance plus organization summaries, explicit 30-day base/stress cash scenarios, overdue/commitment/receipt-reference review flags and structured ledger explanations. There is no connected language model or trained prediction service. See TIER-TWO-THREE-GUIDE.md.

Verification: 34 automated tests, type checking, production build, live Tier 2/3 HTTP workflows and Tier 1 full-cycle regression. Member isolation and role behavior are tested against the application service with an in-memory database. Real separate-user hosted sign-in remains unverified.

Customer readiness is not established: payment integrations, independent accounting/security review, customer migration validation, hosted operational recovery and acceptance remain. D1 uses explicit tenant authorization and database link checks. No payment or external message is sent. The local runtime uses a mock development identity.

Hosted publication remains blocked by automatic approval review of source-repository credential creation. The application remains a local supervised-trial build.
