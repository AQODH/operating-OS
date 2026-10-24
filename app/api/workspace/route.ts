import {requireOrganizationActor,listOrganizationAccess,requireOrganizationAssignee,requireManageableOrganizationMembership} from '../../../lib/platform-roles.mjs';
import {readDigital,mutateDigital} from '../../../lib/digital-server';
import {meetingPosting} from '../../../lib/tier-one.mjs';
import { requireTenant } from '../../../lib/tenancy.mjs';
import { parseCSV } from '../../../lib/csv.mjs';
import { policy, defaultPolicy, loanTerms, schedule, formFields, validateSubmission } from '../../../lib/domain.mjs';
import { authorize, approveLoan } from '../../../lib/authorization.mjs';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { contribution, disbursement, flatInterest, allocateRepayment, journal, reverse, money } from '../../../lib/finance/core.mjs';
const db = () => { if (!env.DB)
    throw new Error('Database is unavailable'); return env.DB; };
const id = () => crypto.randomUUID();
async function context(req: Request) { const user = await getChatGPTUser(); if (!user)
    throw new Error('Please sign in to continue.'); await requireOrganizationActor(db(),user); const tenant = new URL(req.url).searchParams.get('tenant'); const access = tenant ? await requireTenant(db(), user, tenant) : { role: 'organization_user' }; return { user, tenant, role: access.role,organization:'organization' in access?access.organization:null,memberId:'memberId' in access?access.memberId:undefined }; }
export async function GET(req: Request) { try {
    const { user, tenant, role,organization,memberId } = await context(req);
    const organizations = await listOrganizationAccess(db(), user);
    if (!tenant)
        return privateJSON({ organizations });
    if(organization&&[2,3].includes(organization.tier))return privateJSON(await readDigital(db(),tenant,{role,organization,memberId},organizations));
    const [r, t, e, a] = await Promise.all([db().prepare('SELECT * FROM records WHERE tenant=? ORDER BY created DESC').bind(tenant).all(), db().prepare('SELECT * FROM transactions WHERE tenant=? ORDER BY created DESC').bind(tenant).all(), db().prepare('SELECT * FROM entries WHERE tenant=?').bind(tenant).all(), db().prepare('SELECT * FROM audit WHERE tenant=? ORDER BY created DESC LIMIT 200').bind(tenant).all()]);
    const memberships = role === 'organization_admin' ? (await db().prepare('SELECT id,email,role FROM memberships WHERE tenant=?').bind(tenant).all()).results : [];
    const meetingTransactions=(await db().prepare('SELECT * FROM meeting_transactions WHERE tenant=?').bind(tenant).all()).results;return privateJSON({ organizations, role, memberships,meetingTransactions, records: r.results.map((v: any) => ({ ...v, data: JSON.parse(v.data) })), transactions: t.results, entries: e.results, audit: a.results });
}
catch (e) {
    return privateJSON({ error: (e as Error).message }, { status: 403 });
} }
export async function POST(req: Request) {
    try {
        if (req.headers.get('origin') !== new URL(req.url).origin)
            throw new Error('Invalid request origin');
        const { user, tenant, role,organization,memberId } = await context(req);
        const parsed = await req.json();
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
            throw new Error('Invalid request');
        const body = parsed as Record<string, any>;
        const now = new Date().toISOString();
        const b = db();
        const text = (v: any, max = 200) => { if (typeof v !== 'string' || !v.trim() || v.length > max)
            throw new Error('Required text is missing or too long'); return v.trim(); };
        if (body.action === 'organization') throw new Error('Organization registration belongs to platform administration.');
        if (!tenant)
            throw new Error('Choose an organization');if(organization&&[2,3].includes(organization.tier))return privateJSON(await mutateDigital(b,tenant,{role,organization,memberId},user,body));if(organization?.tier!==1)throw new Error('This organization has a different tier. Its features are not available in the Tier 1 build.');
        const log = (action: string, target: string) => b.prepare('INSERT INTO audit(id,tenant,actor,action,target,created) VALUES(?,?,?,?,?,?)').bind(id(), tenant, user.userId, action, target, now);
        const record = async (rid: string, kind?: string) => { const r: any = await b.prepare('SELECT * FROM records WHERE id=? AND tenant=?').bind(rid, tenant).first(); if (!r || kind && r.kind !== kind)
            throw new Error('Record not found'); return { ...r, data: JSON.parse(r.data) }; };
        if (body.action === 'importMembers') {
            authorize(role, 'create');
            const rows = parseCSV(body.csv);
            if (rows.length > 40)
                throw new Error('Import at most 40 members per batch');
            const key = text(body.key, 100);
            const importId = tenant + ':import:' + key;
            const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.csv)))).map(v => v.toString(16).padStart(2, '0')).join('');
            const prior: any = await b.prepare("SELECT data FROM records WHERE id=? AND tenant=? AND kind='import'").bind(importId, tenant).first();
            if (prior) {
                if (JSON.parse(prior.data).fingerprint !== fingerprint)
                    throw new Error('Import key already used for another file');
                return privateJSON({ duplicate: true, count: rows.length });
            }
            await b.batch([...rows.map(row => b.prepare('INSERT INTO records(id,tenant,kind,name,data,version,created) VALUES(?,?,?,?,?,1,?)').bind(id(), tenant, 'member', row.name, JSON.stringify({ phone: row.phone, email: row.email }), now)), b.prepare('INSERT INTO records(id,tenant,kind,name,data,version,created) VALUES(?,?,?,?,?,1,?)').bind(importId, tenant, 'import', 'Member CSV import', JSON.stringify({ fingerprint, count: rows.length }), now), log('import members', importId)]);
            return privateJSON({ count: rows.length });
        }
        if (body.action === 'invite') {
            authorize(role, 'invite');
            const email = text(body.email).toLowerCase();
            await requireOrganizationAssignee(b,email);await requireManageableOrganizationMembership(b,tenant,email);
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                throw new Error('Invalid email');
            if (!['officer', 'treasurer', 'viewer'].includes(body.role))
                throw new Error('Invalid role');
            await b.batch([b.prepare('INSERT INTO memberships(id,tenant,email,role,created) VALUES(?,?,?,?,?) ON CONFLICT(tenant,email) DO UPDATE SET role=excluded.role').bind(id(), tenant, email, body.role, now), log('grant ' + body.role, email)]);
            return privateJSON({ ok: true });
        }
        if (body.action === 'create') {
            authorize(role, 'create');
            if (!['member','loan','reconciliation'].includes(body.kind))
                throw new Error('Unsupported record type');
            const createGuards:D1PreparedStatement[]=[];let data = body.data ?? {};
            if (!data || typeof data !== 'object' || Array.isArray(data))
                throw new Error('Invalid record details');
            if (JSON.stringify(data).length > 20000)
                throw new Error('Record is too large');
            if (body.kind === 'loan') {
                await record(data.member, 'member');
                const currentMeeting:any=await b.prepare("SELECT * FROM records WHERE id=? AND tenant=? AND kind='meeting'").bind(data.meeting,tenant).first();if(!currentMeeting||JSON.parse(currentMeeting.data).status!=='open')throw new Error('Open a group meeting before recording a loan request');const meetingData=JSON.parse(currentMeeting.data);const groupCycle:any=await b.prepare("SELECT * FROM records WHERE id=? AND tenant=? AND kind='cycle'").bind(meetingData.cycle,tenant).first();const cycleRules=JSON.parse(groupCycle.data);if(cycleRules.status!=='active')throw new Error('The savings cycle has ended');const memberSavings:any=await b.prepare("SELECT -COALESCE(SUM(e.amount),0) saved FROM entries e JOIN transactions t ON t.id=e.\"transaction\" JOIN meeting_transactions mt ON mt.\"transaction\"=t.id JOIN records m ON m.id=mt.meeting WHERE t.tenant=? AND t.member=? AND e.account='member_contributions' AND json_extract(m.data,'$.cycle')=?").bind(tenant,data.member,groupCycle.id).first();const outstanding:any=await b.prepare("SELECT COALESCE(SUM(e.amount),0) total FROM entries e JOIN transactions t ON t.id=e.\"transaction\" WHERE t.tenant=? AND t.member=? AND e.account='loan_principal'").bind(tenant,data.member).first();const reserved:any=await b.prepare("SELECT COALESCE(SUM(json_extract(data,'$.principal')),0) total FROM records WHERE tenant=? AND kind='loan' AND json_extract(data,'$.cycle')=? AND json_extract(data,'$.member')=? AND json_extract(data,'$.status') IN ('submitted','approved')").bind(tenant,groupCycle.id,data.member).first();if(data.principal+outstanding.total+reserved.total>memberSavings.saved*cycleRules.loanMultiple)throw new Error('Loan request exceeds the cycle savings multiplier');createGuards.push(b.prepare('INSERT INTO guards(id,ok) VALUES(?,(SELECT COUNT(*) FROM records WHERE id=? AND tenant=? AND version=?))').bind(id(),currentMeeting.id,tenant,currentMeeting.version),b.prepare('UPDATE records SET version=version+1 WHERE id=? AND tenant=?').bind(currentMeeting.id,tenant));data.cycle=groupCycle.id;const current: any = await b.prepare("SELECT * FROM records WHERE tenant=? AND kind='policy' ORDER BY created DESC,id DESC LIMIT 1").bind(tenant).first();
                const active = policy({...defaultPolicy,annualRate:cycleRules.annualRate,maxMonths:cycleRules.maxMonths,maxPrincipal:cycleRules.maxPrincipal??5000000,minimumGuarantors:0});
                data = loanTerms(data, active);
                for (const guarantor of data.guarantors)
                    await record(guarantor, 'member');
                data.status = 'submitted';
                data.policyVersion = groupCycle.id;
                data.requestedBy = user.userId;
                data.startDate = data.startDate || now.slice(0, 10);
                data.schedule = schedule(data.principal, data.interest, data.months, data.startDate);
            }
            if (body.kind === 'policy') {
                authorize(role, 'invite');
                data = policy(data);
            }
            if (body.kind === 'project') {
                money(data.budget);
                data.status = 'active';
            }
            if (body.kind === 'form')
                data = { ...data, fields: formFields(data.fields) };
            if (body.kind === 'submission') {
                const form = await record(data.form, 'form');
                data = { form: form.id, formVersion: form.version, values: validateSubmission(form.data.fields, data.values), submittedBy: user.userId };
            }
            if (body.kind === 'reconciliation') {
                authorize(role, 'post');
                if (!Number.isSafeInteger(data.actual) || data.actual < 0)
                    throw new Error('Invalid actual cash amount');
                const watermark:any=await b.prepare('SELECT COUNT(*) n FROM transactions WHERE tenant=?').bind(tenant).first();createGuards.push(b.prepare('INSERT INTO guards(id,ok) VALUES(?,(SELECT COUNT(*)=? FROM transactions WHERE tenant=?))').bind(id(),watermark.n,tenant));const balance: any = await b.prepare("SELECT COALESCE(SUM(amount),0) balance FROM entries WHERE tenant=? AND account='cash'").bind(tenant).first();
                data = { ...data, recorded: balance.balance, difference: data.actual - balance.balance, status: data.actual === balance.balance ? 'matched' : 'difference', transactionCount:watermark.n, asOf: now, confirmedBy: user.userId };
            }
            const rid = id();
            await b.batch([...createGuards,b.prepare('INSERT INTO records(id,tenant,kind,name,data,version,created) VALUES(?,?,?,?,?,1,?)').bind(rid, tenant, body.kind, text(body.name), JSON.stringify(data), now), log('create ' + body.kind, rid), b.prepare('INSERT INTO records(id,tenant,kind,name,data,version,created) VALUES(?,?,?,?,?,1,?)').bind(id(), tenant, 'notification', body.kind + ' recorded: ' + text(body.name), JSON.stringify({ source: rid, channel: 'in-app', actor: user.userId }), now)]);
            return privateJSON({ id: rid });
        }
        if (body.action === 'guarantee') {throw new Error('Tier 1 uses witnessed group loan decisions');
            authorize(role, 'approve');
            const loan = await record(body.loan, 'loan');
            if (loan.data.status !== 'submitted' || !loan.data.guarantors.includes(body.member))
                throw new Error('Select a nominated guarantor on a submitted loan');
            const evidence = text(body.evidence, 1000);
            const rid = id();
            await b.batch([b.prepare('INSERT INTO guards(id,ok) VALUES(?,(SELECT COUNT(*) FROM records WHERE id=? AND tenant=? AND version=?))').bind(id(), loan.id, tenant, loan.version), b.prepare('UPDATE records SET version=version+1 WHERE id=? AND tenant=?').bind(loan.id, tenant), b.prepare('INSERT INTO records(id,tenant,kind,name,data,version,created) VALUES(?,?,?,?,?,1,?)').bind(rid, tenant, 'guarantee', 'Guarantor consent', JSON.stringify({ loan: loan.id, member: body.member, evidence, accepted: true, recordedBy: user.userId }), now), log('record guarantor consent', rid)]);
            return privateJSON({ id: rid });
        }
        if (body.action === 'approve') {throw new Error('Use the open meeting to record a witnessed group loan decision');
            authorize(role, 'approve');
            const r = await record(body.id, 'loan');
            const approved = approveLoan(r.data, user.userId);
            const confirmations = await b.prepare("SELECT data FROM records WHERE tenant=? AND kind='guarantee'").bind(tenant).all();
            for (const member of r.data.guarantors ?? []) {
                if (!confirmations.results.some((c: any) => { const d = JSON.parse(c.data); return d.loan === r.id && d.member === member && d.accepted === true; }))
                    throw new Error('Record consent evidence for every guarantor before approval');
            }
            const result = await b.batch([b.prepare('INSERT INTO guards(id,ok) VALUES(?,(SELECT COUNT(*) FROM records WHERE id=? AND tenant=? AND version=?))').bind(id(), r.id, tenant, r.version), b.prepare('UPDATE records SET data=?,version=version+1 WHERE id=? AND tenant=? AND version=?').bind(JSON.stringify(approved), r.id, tenant, r.version), log('approve loan', r.id)]);
            if (!result[1].meta.changes)
                throw new Error('Record changed; reload');
            return privateJSON({ ok: true });
        }
        if (body.action === 'revoke') {
            authorize(role, 'invite');
            const email = text(body.email).toLowerCase();
            await requireManageableOrganizationMembership(b,tenant,email);
            await b.batch([b.prepare('DELETE FROM memberships WHERE tenant=? AND email=?').bind(tenant, email), log('revoke access', email)]);
            return privateJSON({ ok: true });
        }
        if (body.action === 'reject') {throw new Error('Record a witnessed group decision in the open meeting');
            authorize(role, 'approve');
            const r = await record(body.id, 'loan');
            if (r.data.status !== 'submitted')
                throw new Error('Loan is not awaiting review');
            await b.batch([b.prepare('INSERT INTO guards(id,ok) VALUES(?,(SELECT COUNT(*) FROM records WHERE id=? AND tenant=? AND version=?))').bind(id(), r.id, tenant, r.version), b.prepare('UPDATE records SET data=?,version=version+1 WHERE id=? AND tenant=?').bind(JSON.stringify({ ...r.data, status: 'rejected', reason: text(body.reason) }), r.id, tenant), log('reject loan', r.id)]);
            return privateJSON({ ok: true });
        }
        if (body.action === 'reverse') {authorize(role,'post');const prior:any=await b.prepare('SELECT * FROM transactions WHERE tenant=? AND reverses=?').bind(tenant,body.id).first();if(prior){const link:any=await b.prepare('SELECT meeting FROM meeting_transactions WHERE "transaction"=? AND tenant=?').bind(prior.id,tenant).first();if(prior.description!=='Reversal: '+text(body.reason,180)||link?.meeting!==body.meeting)throw new Error('This entry has already been reversed with different details');return privateJSON({id:prior.id,duplicate:true})}const correctionMeeting:any=await b.prepare("SELECT * FROM records WHERE id=? AND tenant=? AND kind='meeting'").bind(body.meeting,tenant).first();if(!correctionMeeting||JSON.parse(correctionMeeting.data).status!=='open')throw new Error('Corrections need an open meeting');correctionMeeting.data=JSON.parse(correctionMeeting.data);const originalMeeting:any=await b.prepare("SELECT r.data FROM records r JOIN meeting_transactions mt ON mt.meeting=r.id WHERE mt.\"transaction\"=? AND mt.tenant=?").bind(body.id,tenant).first();if(!originalMeeting||JSON.parse(originalMeeting.data).cycle!==correctionMeeting.data.cycle)throw new Error('Choose a transaction in the current savings cycle');
            authorize(role, 'post');
            const revision: any = await b.prepare('SELECT COUNT(*) n FROM transactions WHERE tenant=?').bind(tenant).first();
            const original: any = await b.prepare('SELECT * FROM transactions WHERE id=? AND tenant=?').bind(body.id, tenant).first();
            if (!original || original.reverses)
                throw new Error('Select an original transaction');
            if (original.source) {
                const source = await record(original.source);
                if (source.kind === 'loan'||source.kind==='cycle')
                    throw new Error('Loan corrections require a supervised adjustment; automatic reversal is disabled');
            }
            const old = await b.prepare('SELECT account,amount FROM entries WHERE \"transaction\"=? AND tenant=?').bind(original.id, tenant).all();
            const lines = reverse(old.results);
            const socialDelta=lines.filter((l:any)=>l.account==='social_cash').reduce((sum:number,l:any)=>sum+l.amount,0);const social:any=await b.prepare("SELECT COALESCE(SUM(amount),0) balance FROM entries WHERE tenant=? AND account='social_cash'").bind(tenant).first();if(social.balance+socialDelta<0)throw new Error('Reversal would exceed emergency cash');const cashDelta = lines.filter((l: any) => l.account === 'cash').reduce((sum: number, l: any) => sum + l.amount, 0);
            const cash: any = await b.prepare("SELECT COALESCE(SUM(amount),0) balance FROM entries WHERE tenant=? AND account='cash'").bind(tenant).first();
            if (cash.balance + cashDelta < 0)
                throw new Error('Reversal would exceed available recorded cash');
            const tid = id();
            await b.batch([b.prepare('INSERT INTO guards(id,ok) VALUES(?,(SELECT COUNT(*) FROM records WHERE id=? AND tenant=? AND version=?))').bind(id(),correctionMeeting.id,tenant,correctionMeeting.version),b.prepare('UPDATE records SET version=version+1 WHERE id=? AND tenant=?').bind(correctionMeeting.id,tenant),b.prepare('INSERT INTO guards(id,ok) VALUES(?,(SELECT COUNT(*)=? FROM transactions WHERE tenant=?))').bind(id(), revision.n, tenant), b.prepare('INSERT INTO transactions(id,tenant,key,description,member,source,reverses,actor,created) VALUES(?,?,?,?,?,?,?,?,?)').bind(tid, tenant, text(body.key, 100), 'Reversal: ' + text(body.reason, 180), original.member, original.source, original.id, user.userId, now), ...lines.map((l: any) => b.prepare('INSERT INTO entries(id,\"transaction\",tenant,account,amount) VALUES(?,?,?,?,?)').bind(id(), tid, tenant, l.account, l.amount)), b.prepare('INSERT INTO seals(\"transaction\",created) VALUES(?,?)').bind(tid, now), db().prepare('INSERT INTO meeting_transactions VALUES(?,?,?)').bind(tid,correctionMeeting.id,tenant),log('reverse transaction', original.id)]);
            return privateJSON({ id: tid });
        }
        if (body.action === 'post') {if(!['opening','contribution','fine','socialContribution','socialPayout','groupExpense','disbursement','repayment'].includes(body.type))throw new Error('This money action is not available in Tier 1');
            authorize(role, 'post');
            const revision: any = await b.prepare('SELECT COUNT(*) n FROM transactions WHERE tenant=?').bind(tenant).first();
            const key = text(body.key, 100);
            const existing: any = await b.prepare('SELECT * FROM transactions WHERE tenant=? AND key=?').bind(tenant, key).first();
            if (existing) {
                const old: any = await b.prepare('SELECT COALESCE(SUM(CASE WHEN amount>0 THEN amount ELSE 0 END),0) total FROM entries WHERE "transaction"=? AND tenant=?').bind(existing.id, tenant).first();
                const expectedSource = ['contribution','opening','fine','socialContribution','socialPayout','groupExpense'].includes(body.type) ? null : body.source;
                const expectedMember = ['contribution','fine','socialContribution','socialPayout'].includes(body.type) ? body.member : existing.member;
                const expectedAccount = ({ contribution: 'member_contributions', opening: 'opening_equity', expense: 'project_expense', disbursement: 'loan_principal', repayment:'cash',fine:'fine_income',socialContribution:'social_fund',socialPayout:'social_cash',groupExpense:'group_expense' } as Record<string, string>)[body.type];
                const matches: any = await b.prepare('SELECT COUNT(*) n FROM entries WHERE "transaction"=? AND account=? AND amount ' + (body.type === 'disbursement' || body.type === 'expense' || body.type === 'repayment'||body.type==='groupExpense' ? '>0' : '<0')).bind(existing.id, expectedAccount ?? '').first();
                if (!matches.n)
                    throw new Error('Submission key already used for another action');
                if (old.total !== body.amount || existing.description !== body.description || existing.source !== expectedSource || existing.member !== expectedMember)
                    throw new Error('Submission key already used for different details');
                if(body.type!=='opening'){const linked:any=await b.prepare('SELECT meeting FROM meeting_transactions WHERE \"transaction\"=? AND tenant=?').bind(existing.id,tenant).first();if(linked?.meeting!==body.meeting)throw new Error('Submission key belongs to a different meeting')}return privateJSON({ id: existing.id, duplicate: true });
            }
            let meeting:any=null;let cycle:any=null;if(body.type!=='opening'){meeting=await b.prepare("SELECT * FROM records WHERE id=? AND tenant=? AND kind='meeting'").bind(body.meeting,tenant).first();if(!meeting||JSON.parse(meeting.data).status!=='open')throw new Error('Select the open group meeting before recording money');meeting.data=JSON.parse(meeting.data);cycle=await b.prepare("SELECT * FROM records WHERE id=? AND tenant=? AND kind='cycle'").bind(meeting.data.cycle,tenant).first();cycle.data=JSON.parse(cycle.data);if(cycle.data.status!=='active')throw new Error('This cycle has ended; close its final meeting');}let lines: readonly any[] = [];
            let member: string | null = null;
            let source: string | null = null;
            let reverses: string | null = null;
            let sourceRecord: any = null;
            money(body.amount);
            if (['expense', 'disbursement'].includes(body.type)) {
                const cash: any = await b.prepare("SELECT COALESCE(SUM(amount),0) balance FROM entries WHERE tenant=? AND account='cash'").bind(tenant).first();
                if (cash.balance < body.amount)
                    throw new Error('Insufficient recorded cash');
            }
            if (body.type === 'opening') {
                authorize(role, 'invite');
                if (revision.n !== 0)
                    throw new Error('Opening cash can only be posted before other transactions');
                lines = journal([{ account: 'cash', amount: body.amount }, { account: 'opening_equity', amount: -body.amount }]);
            }
            else if (body.type === 'contribution') {
                await record(body.member, 'member');
                member = body.member;if(body.amount%cycle.data.sharePrice!==0)throw new Error('Savings must be a whole number of shares at the cycle share price');
                lines = contribution(body.amount);
            }
            else if(['fine','socialContribution','socialPayout','groupExpense'].includes(body.type)){if(body.type!=='groupExpense'){await record(body.member,'member');member=body.member}if(body.type==='socialPayout'){const social:any=await b.prepare("SELECT COALESCE(SUM(amount),0) balance FROM entries WHERE tenant=? AND account='social_cash'").bind(tenant).first();if(body.amount>social.balance)throw new Error('Insufficient emergency fund cash')}if(body.type==='groupExpense'){const cash:any=await b.prepare("SELECT COALESCE(SUM(amount),0) balance FROM entries WHERE tenant=? AND account='cash'").bind(tenant).first();if(body.amount>cash.balance)throw new Error('Insufficient recorded cash');lines=journal([{account:'group_expense',amount:body.amount},{account:'cash',amount:-body.amount}])}else lines=meetingPosting(body.type,body.amount)}else if (body.type === 'expense') {
                const project = await record(body.source, 'project');
                sourceRecord = project;
                source = body.source;
                const spent: any = await b.prepare("SELECT COALESCE(SUM(e.amount),0) spent FROM entries e JOIN transactions t ON t.id=e.\"transaction\" WHERE t.tenant=? AND t.source=? AND e.account='project_expense'").bind(tenant, source).first();
                if (spent.spent + body.amount > project.data.budget)
                    throw new Error('Expense exceeds project budget');
                lines = journal([{ account: 'project_expense', amount: body.amount }, { account: 'cash', amount: -body.amount }]);
            }
            else if (body.type === 'disbursement' || body.type === 'repayment') {
                const loan = await record(body.source, 'loan');
                sourceRecord = loan;
                source = loan.id;
                member = loan.data.member;
                const history = await b.prepare('SELECT e.account,e.amount FROM entries e JOIN transactions t ON t.id=e."transaction" WHERE t.tenant=? AND t.source=?').bind(tenant, source).all();
                let principal = 0, interestPaid = 0;
                for (const row of history.results as any[]) {
                    if (row.account === 'loan_principal')
                        principal += row.amount;
                    if (row.account === 'interest_income')
                        interestPaid -= row.amount;
                }
                if(loan.data.cycle!==meeting.data.cycle)throw new Error('The loan belongs to a different savings cycle');if (body.type === 'disbursement') {
                    if (loan.data.status !== 'approved' || history.results.length)
                        throw new Error('Requires an approved, undisbursed loan');
                    if (body.amount !== loan.data.principal)
                        throw new Error('Amount must match approved principal');
                    lines = disbursement(body.amount);sourceRecord.data={...sourceRecord.data,status:'disbursed',disbursedAt:now};
                }
                else {
                    if (principal <= 0)
                        throw new Error('No outstanding loan principal');
                    const allocation = allocateRepayment(body.amount, principal, Math.max(0, loan.data.interest - interestPaid));sourceRecord.data={...sourceRecord.data,status:principal-allocation.principal===0?'settled':'disbursed'};
                    lines = journal([{ account: 'cash', amount: body.amount }, ...(allocation.principal ? [{ account: 'loan_principal', amount: -allocation.principal }] : []), ...(allocation.interest ? [{ account: 'interest_income', amount: -allocation.interest }] : [])]);
                }
            }
            else
                throw new Error('Unsupported posting');
            const tid = id();
            const lock = sourceRecord ? [b.prepare('INSERT INTO guards(id,ok) VALUES(?,(SELECT COUNT(*) FROM records WHERE id=? AND tenant=? AND version=?))').bind(id(), sourceRecord.id, tenant, sourceRecord.version), b.prepare('UPDATE records SET data=?,version=version+1 WHERE id=? AND tenant=?').bind(JSON.stringify(sourceRecord.data),sourceRecord.id, tenant)] : [];
            await b.batch([b.prepare('INSERT INTO guards(id,ok) VALUES(?,(SELECT COUNT(*)=? FROM transactions WHERE tenant=?))').bind(id(), revision.n, tenant), ...lock,...(meeting?[b.prepare('INSERT INTO guards(id,ok) VALUES(?,(SELECT COUNT(*) FROM records WHERE id=? AND tenant=? AND version=?))').bind(id(),meeting.id,tenant,meeting.version),b.prepare('UPDATE records SET version=version+1 WHERE id=? AND tenant=?').bind(meeting.id,tenant)]:[]), b.prepare('INSERT INTO transactions(id,tenant,key,description,member,source,reverses,actor,created) VALUES(?,?,?,?,?,?,?,?,?)').bind(tid, tenant, key, text(body.description), member, source, reverses, user.userId, now), ...lines.map(l => b.prepare('INSERT INTO entries(id,"transaction",tenant,account,amount) VALUES(?,?,?,?,?)').bind(id(), tid, tenant, l.account, l.amount)), b.prepare('INSERT INTO seals("transaction",created) VALUES(?,?)').bind(tid, now), ...(meeting?[b.prepare('INSERT INTO meeting_transactions VALUES(?,?,?)').bind(tid,meeting.id,tenant)]:[]),log('post ' + body.type, tid)]);
            return privateJSON({ id: tid });
        }
        throw new Error('Unsupported action');
    }
    catch (e) {
        return privateJSON({ error: (e as Error).message }, { status: 400 });
    }
}

function privateJSON(data:any,init:ResponseInit={}){return Response.json(data,{...init,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}
