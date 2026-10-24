'use client';
import { OrganizationSwitcher, FormBuilder, sectionCopy, helpfulError } from './workspace-ui';
import DomainTools from './domain-tools';
import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, Wallet, Landmark, FolderKanban, ClipboardList, FileBarChart, Settings, ShieldCheck, ArrowUpRight, Plus, Search, Menu, X, Bell, CheckCircle2, AlertCircle, Building2, ArrowRight, RefreshCw, HelpCircle } from 'lucide-react';
const sections = [['Overview', LayoutDashboard], ['Members', Users], ['Contributions', Wallet], ['Loans', Landmark], ['Projects', FolderKanban], ['Forms', ClipboardList], ['Reports', FileBarChart], ['Policies', Settings], ['Notifications', Bell], ['Audit trail', ShieldCheck]] as const;
const ugx = (n: number) => 'UGX ' + new Intl.NumberFormat('en-UG').format(Object.is(n, -0) ? 0 : n);
export default function Workspace({ displayName }: {
    displayName: string;
}) {
    const dialogRef=useRef<HTMLFormElement>(null);const tenantRef = useRef('');
    const [selectedRecord,setSelectedRecord]=useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(true);
    const submissionKey = useRef(crypto.randomUUID());
    const loadSequence = useRef(0);
    const [state, setState] = useState<any>({ organizations: [], records: [], transactions: [], entries: [], audit: [] });
    const [tenant, setTenant] = useState('');
    const [section, setSection] = useState('Overview');
    const [modal, setModal] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [query, setQuery] = useState('');
    const [menu, setMenu] = useState(false);
    tenantRef.current = tenant;
    async function load() { setLoading(true); const requestedTenant = tenant; const sequence = ++loadSequence.current; try {
        const r = await fetch('/api/workspace' + (tenant ? '?tenant=' + tenant : ''));
        const d: any = await r.json();
        if (!r.ok)
            throw Error(d.error);
        if (sequence !== loadSequence.current || tenantRef.current !== requestedTenant)
            return;
        setState((s: any) => ({ ...s, ...d, loadedTenant: requestedTenant }));
        setLoading(false);
        if (!tenant && d.organizations.length)
            setTenant(d.organizations.some((o:any)=>o.id===sessionStorage.getItem('aqodh-active-organization'))?sessionStorage.getItem('aqodh-active-organization')!:d.organizations[0].id);
    }
    catch (e) {
        if (sequence === loadSequence.current) {
            setError((e as Error).message);
            setLoading(false);
        }
    } }
    useEffect(() => { setState((s: any) => ({ ...s, records: [], transactions: [], entries: [], audit: [] })); load(); }, [tenant]);
    useEffect(()=>{setSelectedRecord('');window.scrollTo({top:0,behavior:'auto'})},[tenant,section]);
    useEffect(() => { submissionKey.current = crypto.randomUUID();if(!modal)return;const previous=document.activeElement as HTMLElement;const frame=requestAnimationFrame(()=>{const field=dialogRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]),select,textarea');field?.focus()});return()=>{cancelAnimationFrame(frame);if(previous?.isConnected)previous.focus()} }, [modal]);
    async function send(body: any) { const targetTenant = tenant; setBusy(true); setError(''); try {
        const r = await fetch('/api/workspace' + (tenant ? '?tenant=' + tenant : ''), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const d: any = await r.json();
        if (!r.ok)
            throw Error(d.error);
        if (tenantRef.current === targetTenant) {
            setModal('');
            setNotice(body.action === 'post' ? 'Financial record saved. It is now included in this organization’s ledger.' : body.action === 'invite' ? 'Access saved for this organization. Other organizations are unchanged.' : 'Saved to this organization. You can review the details below.');
            if (body.action === 'organization' && d.id) {
                setTenant(d.id);
            }
            else
                await load();
        }
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    const dataReady = state.loadedTenant === tenant;
    const records = dataReady ? (state.records ?? []) : [];
    const members = records.filter((r: any) => r.kind === 'member');
    const loans = records.filter((r: any) => r.kind === 'loan');
    const projects = records.filter((r: any) => r.kind === 'project');
    const tx = dataReady ? (state.transactions ?? []) : [];
    const entries = dataReady ? (state.entries ?? []) : [];
    const account = (name: string) => entries.filter((e: any) => e.account === name).reduce((s: number, e: any) => s + e.amount, 0);
    const org = state.organizations.find((o: any) => o.id === tenant);
    function exportData() { const blob = new Blob([JSON.stringify({organization:org,records,transactions:tx,entries,audit:dataReady?state.audit:[],exportedAt:new Date().toISOString()}, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'aqodh-'+tenant+'-export.json'; a.click(); URL.revokeObjectURL(url); }
    async function submit(e: any) { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); if (modal === 'invite')
        return send({ action: 'invite', email: f.email, role: f.role }); if (modal === 'organization')
        return send({ action: 'organization', name: f.name }); if (modal === 'contribution' || modal === 'expense' || modal === 'repayment' || modal === 'disbursement')
        return send({ action: 'post', type: modal, amount: Number(f.amount), member: f.member, source: f.source, description: f.description, key: submissionKey.current }); const data: any = { ...f }; if (modal === 'project')
        data.budget = Number(f.budget); if (modal === 'policy') {
        data.annualRate = Math.round(Number(f.annualRate) * 100);
        data.maxPrincipal = Number(f.maxPrincipal);
        data.maxMonths = Number(f.maxMonths);
        data.minimumGuarantors = Number(f.minimumGuarantors);
    } if (modal === 'form') {
        try {
            data.fields = JSON.parse(String(f.fields));
        }
        catch {
            setError('Form fields must be valid JSON');
            return;
        }
    } if (modal === 'loan') {
        data.guarantors = new FormData(e.target).getAll('guarantors');
        data.principal = Number(f.principal);
        data.rate = Math.round(Number(f.rate) * 100);
        data.months = Number(f.months);
    } return send({ action: 'create', kind: modal, name: f.name, data }); }
    const copy = sectionCopy[section];
    const feedback = helpfulError(error);
    const canWrite = state.role !== 'viewer' && (section!=='Policies'||state.role==='owner');
    const kind = section === 'Members' ? 'member' : section === 'Loans' ? 'loan' : section === 'Projects' ? 'project' : section === 'Forms' ? 'form' : section === 'Policies' ? 'policy' : '';
    return <div className="shell"><aside className={menu ? 'sidebar open' : 'sidebar'}><div className="brand"><span className="brandmark">A</span><div>AQODH<small>ORGANIZATION OS</small></div></div><div className="org-label">YOUR WORKSPACE</div><OrganizationSwitcher organizations={state.organizations} value={tenant} onChange={id => { setModal(''); setNotice(''); setError(''); setQuery(''); sessionStorage.setItem('aqodh-active-organization',id);setTenant(id); setMenu(false); }} onCreate={() => setModal('organization')}/><nav>{sections.map(([name, Icon], index) => <div key={name}>{[0, 2, 6, 7].includes(index) && <div className="nav-group-label">{index === 0 ? 'Community' : index === 2 ? 'Finance & work' : index === 6 ? 'Insights' : 'Administration'}</div>}<button aria-current={section === name ? 'page' : undefined} className={section === name ? 'active' : ''} onClick={() => { setSection(name); setQuery(''); setMenu(false); }}><Icon size={18} strokeWidth={1.7} aria-hidden="true"/>{name}{name === 'Loans' && loans.length > 0 && <em>{loans.length}</em>}</button></div>)}</nav><div className="side-bottom"><div className="trial"><ShieldCheck size={19}/><div>Supervised trial<small>Record & reconcile payments</small></div></div><button onClick={() => setModal('organization')}><Plus size={17}/>Add organization</button><button disabled={!dataReady||state.role!=='owner'} title={state.role!=='owner'?'Organization owners manage access':undefined} onClick={() => setModal('invite')}><ShieldCheck size={17}/>Manage officer access</button><div className="profile"><span>{displayName.slice(0, 1)}</span><div>{displayName}<small>{state.role ?? 'Workspace owner'}</small></div></div></div></aside><main><header><button aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} className="mobile" onClick={() => setMenu(!menu)}><Menu /></button><span className="header-organization"><Building2 size={17}/><span><b>{org?.name ?? 'Welcome to AQODH'}</b><small>{tenant ? 'Organization workspace · ' + (state.role ?? 'loading') : 'Choose where you would like to work'}</small></span></span><div><span className="status-dot"/><button className="refresh-workspace" aria-label="Refresh workspace" disabled={loading} onClick={load}><RefreshCw size={16}/></button>Private workspace <span className="avatar">{displayName.slice(0, 1)}</span></div></header><div className="content"><div className="heading"><div><div className="eyebrow">YOUR ORGANIZATION, IN VIEW</div><h1>{copy.title}</h1><p>{copy.description}</p></div><button disabled={loading || !!tenant && !canWrite} title={!canWrite ? 'Your role has read-only access' : undefined} className="primary" onClick={() => setModal(!tenant ? 'organization' : kind || 'contribution')}><Plus size={17}/>{!tenant ? 'Create organization' : copy.action}</button></div>{error && <div role="alert" className="error feedback"><AlertCircle size={20}/><div><b>{feedback.title}</b><p>{feedback.detail}</p></div><button aria-label="Dismiss message" onClick={() => setError('')}><X size={16}/></button></div>}{notice && <div role="status" className="success feedback"><CheckCircle2 size={20}/><div><b>All set</b><p>{notice}</p></div><button aria-label="Dismiss confirmation" onClick={() => setNotice('')}><X size={16}/></button></div>}{loading && <div role="status" className="loading-state"><RefreshCw size={16}/>Opening the right records for you…</div>}{!tenant ? <div className="welcome"><Landmark size={45}/><h2>Your organization starts here</h2><p>Start with your organization’s name. Then add members and set the rules that work for your community. Each organization has its own records and access.</p><button className="primary" onClick={() => setModal('organization')}>Create organization</button></div> : <><div aria-busy={loading||!dataReady} className={loading||!dataReady ? 'workspace-loading' : 'workspace-ready'}>
        {section === 'Overview' && <><div className="stats">{[['Recorded cash', ugx(account('cash')), 'Net of recorded payments'], ['Member contributions', ugx(-account('member_contributions')), 'Across all recorded contributions'], ['Outstanding principal', ugx(account('loan_principal')), 'Based on posted loan entries'], ['Active members', members.length, 'Your community at a glance']].map(([title, value, sub]) => <article key={title}><div>{title}<ArrowUpRight size={16}/></div><strong>{value}</strong><small>{sub}</small></article>)}</div><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><h2>Recent financial activity</h2><button onClick={() => setSection('Reports')}>View ledger →</button></div><TransactionTable tx={tx.slice(0, 7)} entries={entries}/></section><section className="panel"><div className="panel-heading"><h2>Next steps</h2><span className="pill">TRIAL</span></div><div className="tasks">{[['Register your members', 'Build an accurate member register.', 'Members'], ['Review loan applications', loans.filter((l: any) => l.data.status === 'submitted').length + ' applications awaiting review.', 'Loans'], ['Check your financial records', 'Reconcile cash and verify your opening records.', 'Reports']].map(([title, sub, page], i) => <button key={title} onClick={() => setSection(page)}><span className="step">0{i + 1}</span><div><b>{title}</b><small>{sub}</small></div><ArrowUpRight size={17}/></button>)}</div></section></div><div className="notice"><ShieldCheck /><div><b>Built for a supervised start</b><p>These figures reflect recorded transactions. Confirm them against external statements before relying on a balance.</p></div></div></>}
        {kind && <section className="panel"><div className="panel-heading"><h2>{section} <span className="count">{records.filter((r: any) => r.kind === kind).length}</span></h2><label className="search"><Search size={16}/><input placeholder="Search records" value={query} onChange={e => setQuery(e.target.value)}/></label></div><div className="table-scroll"><table><thead><tr><th>Name / reference</th><th>Details</th><th>Created</th><th>Status</th></tr></thead><tbody>{records.filter((r: any) => r.kind === kind && r.name.toLowerCase().includes(query.toLowerCase())).map((r: any) => <tr key={r.id}><td><button className="record-link" onClick={()=>{setSelectedRecord(r.id);document.getElementById('record-details')?.scrollIntoView({behavior:'smooth',block:'start'})}}>{r.name}</button><small>{r.id.slice(0, 8)}</small></td><td>{kind === 'member' ? r.data.phone || '—' : kind === 'loan' ? <>{ugx(r.data.principal)}<small>{r.data.months} months · {r.data.rate / 100}% annual flat</small></> : r.data.notes || '—'}</td><td>{new Date(r.created).toLocaleDateString()}</td><td><span className="pill">{r.data.status || 'Recorded'}</span></td></tr>)}</tbody></table></div>{!records.some((r: any) => r.kind === kind) && <Empty text={'No ' + section.toLowerCase() + ' yet. Add your first record to get started.'}/>}</section>}
        {section === 'Contributions' && <section className="panel"><div className="panel-heading"><h2>Contribution register</h2><button className="primary" onClick={() => setModal('contribution')}>Record contribution</button></div><TransactionTable tx={tx.filter((t: any) => entries.some((e: any) => e.transaction === t.id && e.account === 'member_contributions'))} entries={entries}/></section>}
        {section === 'Reports' && <><div className="actions"><button onClick={exportData}>Export workspace JSON</button><button onClick={() => window.print()}>Print report</button><button onClick={() => setModal('repayment')}>Record repayment</button><button onClick={() => setModal('expense')}>Record project expense</button><button onClick={() => setModal('disbursement')}>Record disbursement</button></div><section className="panel"><div className="panel-heading"><h2>Trial balance</h2><span className="pill">{entries.reduce((s: number, e: any) => s + e.amount, 0) === 0 ? 'BALANCED' : 'REVIEW REQUIRED'}</span></div><table><thead><tr><th>Account</th><th>Debit</th><th>Credit</th></tr></thead><tbody>{Array.from(new Set<string>(entries.map((e: any) => e.account))).map(a => <tr key={a}><td>{a.replaceAll('_', ' ')}</td><td>{account(a) > 0 ? ugx(account(a)) : '—'}</td><td>{account(a) < 0 ? ugx(-account(a)) : '—'}</td></tr>)}</tbody></table></section><section className="panel report"><div className="panel-heading"><h2>General journal</h2></div><TransactionTable tx={tx} entries={entries}/></section></>}
        {section === 'Notifications' && <section className="panel"><div className="panel-heading"><h2>Organization notifications</h2></div>{records.filter((r: any) => r.kind === 'notification').map((r: any) => <div className="tool-content" key={r.id}><b>{r.name}</b><p>{new Date(r.created).toLocaleString()} · In-app</p></div>)}<p className="tool-content">SMS delivery requires a configured provider. No SMS messages are sent by this trial.</p></section>}{section === 'Audit trail' && <section className="panel"><div className="panel-heading"><h2>Recorded actions</h2></div><table><thead><tr><th>Action</th><th>Actor</th><th>Time</th></tr></thead><tbody>{(dataReady ? state.audit : []).map((a: any) => <tr key={a.id}><td>{a.action}<small>{a.target}</small></td><td>{a.actor.slice(0, 16)}</td><td>{new Date(a.created).toLocaleString()}</td></tr>)}</tbody></table></section>}
        <DomainTools selectedRecord={selectedRecord} key={tenant + ':' + section} state={dataReady ? state : { records: [], transactions: [], entries: [] }} section={section} send={send} busy={busy} tenant={tenant} onChange={load}/></div></>}<footer>AQODH Organization OS <span>Supervised trial · UGX · Private access</span></footer></div></main>{modal && <div className="overlay" onKeyDown={e => { if(e.key==='Tab'){const elements=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not([type="hidden"]):not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')??[]).filter(el=>el.offsetParent!==null);const first=elements[0],last=elements[elements.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}if (e.key === 'Escape' && !busy)
        setModal(''); }}><form ref={dialogRef} role="dialog" aria-modal="true" aria-label="Record details" className="dialog" onSubmit={submit}><div className="panel-heading"><h2>{modal === 'organization' ? 'Create organization' : 'Record ' + modal}</h2><button type="button" onClick={() => setModal('')} aria-label="Close"><X /></button></div><p>{modal === 'organization' ? 'A fresh space for your organization’s people, policies and records.' : modal === 'invite' ? 'Give each person the access they need in ' + (org?.name ?? 'this organization') + '.' : 'You’re working in ' + (org?.name ?? 'this organization') + '. Take a moment to check the details before saving.'}</p>{modal === 'invite' ? <><label>Officer email<input name="email" type="email" required/></label><label>Role<select name="role"><option value="officer">Officer — create and approve</option><option value="treasurer">Treasurer — create and post</option><option value="viewer">Viewer — read only</option></select></label><p>This grants access when the person signs in with this email. It does not send an email.</p>{(dataReady ? state.memberships ?? [] : []).map((m: any) => <div className="actions" key={m.id}><small>{m.email} · {m.role}</small><button type="button" disabled={busy} onClick={() => send({ action: 'revoke', email: m.email })}>Revoke access</button></div>)}</> : ['contribution', 'expense', 'repayment', 'disbursement'].includes(modal) ? <><label>Description<input name="description" required maxLength={200}/></label>{modal === 'contribution' ? <label>Member<select name="member" required><option value="">Select member</option>{members.map((m: any) => <option value={m.id} key={m.id}>{m.name}</option>)}</select></label> : <label>{modal === 'expense' ? 'Project' : 'Loan'}<select name="source" required><option value="">Select record</option>{(modal === 'expense' ? projects : loans).map((r: any) => <option value={r.id} key={r.id}>{r.name}</option>)}</select></label>}<label>Amount (UGX)<input name="amount" type="number" min="1" step="1" required/></label></> : <><label>{modal === 'organization' ? 'Organization name' : 'Name / reference'}<input name="name" required maxLength={200}/></label>{modal === 'member' && <><label>Phone<input name="phone" type="tel"/></label><label>Email<input name="email" type="email"/></label></>}{modal === 'loan' && <><label>Member<select name="member" required><option value="">Select member</option>{members.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><div className="form-grid"><label>Principal (UGX)<input name="principal" type="number" min="1" step="1" required/></label><p>Interest follows the latest organization policy.</p><label>Term (months)<input name="months" type="number" min="1" max="120" step="1" required/></label></div></>}{modal === 'project' && <label>Budget (UGX)<input name="budget" type="number" min="1" step="1" required/></label>}{modal === 'loan' && <><label>Guarantors<select multiple name="guarantors">{members.map((m: any) => <option value={m.id} key={m.id}>{m.name}</option>)}</select><small>Select members other than the borrower. Policy determines the required number.</small></label><label>Schedule start date<input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)}/></label></>}{modal === 'policy' && <div className="form-grid"><label>Annual flat rate (%)<input name="annualRate" type="number" step="0.01" min="0" defaultValue="12" required/></label><label>Maximum principal (UGX)<input name="maxPrincipal" type="number" step="1" defaultValue="5000000" required/></label><label>Maximum months<input name="maxMonths" type="number" min="1" max="120" defaultValue="24" required/></label><label>Minimum guarantors<input name="minimumGuarantors" type="number" min="0" max="10" defaultValue="1" required/></label></div>}{modal === 'form' && <FormBuilder />}{modal !== 'organization' && <label>Notes<textarea name="notes" maxLength={2000}/></label>}</>}{error && <div role="alert" className="error"><b>{feedback.title}</b><p>{feedback.detail}</p></div>}<div className="dialog-footer"><button type="button" onClick={() => setModal('')}>Cancel</button><button disabled={busy} className="primary">{busy ? 'Saving…' : 'Save record'}</button></div></form></div>}</div>;
}
function Empty({ text }: {
    text: string;
}) { return <div className="empty"><ClipboardList size={28}/><p>{text}</p></div>; }
function TransactionTable({ tx, entries }: {
    tx: any[];
    entries: any[];
}) { return tx.length ? <div className="table-scroll"><table><thead><tr><th>Transaction</th><th>Date</th><th>Amount</th></tr></thead><tbody>{tx.map(t => <tr key={t.id}><td><b>{t.description}</b><small>{t.id.slice(0, 8)}</small></td><td>{new Date(t.created).toLocaleDateString()}</td><td className="amount">{ugx(entries.filter(e => e.transaction === t.id && e.amount > 0).reduce((s, e) => s + e.amount, 0))}</td></tr>)}</tbody></table></div> : <Empty text="No financial activity recorded yet."/>; }
