'use client';
import {useEffect, useRef, useState} from 'react';
import {Building2, ShieldCheck, Plus, RefreshCw, CheckCircle2, AlertCircle} from 'lucide-react';

type PlatformState = {organizations: any[]; administrators: any[]; audit: any[]};
const tierNames: Record<number, string> = {1: 'Community Groups', 2: 'Digital SACCO', 3: 'Intelligent Finance'};

export default function PlatformWorkspace({displayName}: {displayName: string}) {
  const [state, setState] = useState<PlatformState>({organizations: [], administrators: [], audit: []});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const registerKey = useRef(crypto.randomUUID());
  const assignKey = useRef(crypto.randomUUID());

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/platform');
      const data = await response.json() as PlatformState & {error?: string};
      if (!response.ok) throw Error(data.error || 'Platform directory unavailable.');
      if (!Array.isArray(data.organizations) || !Array.isArray(data.administrators) || !Array.isArray(data.audit)) throw Error('Invalid platform directory response.');
      setState(data);
    } catch (problem) {
      setError((problem as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {void load();}, []);

  async function save(event: React.FormEvent<HTMLFormElement>, action: string, key: React.RefObject<string>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/platform', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...fields, ...(action === 'registerOrganization' ? {tier: Number(fields.tier)} : {}), action, key: key.current}),
      });
      const result = await response.json() as {error?: string};
      if (!response.ok) throw Error(result.error || 'Platform action could not be saved.');
      key.current = crypto.randomUUID();
      form.reset();
      setNotice(action === 'registerOrganization' ? 'Organization registered. Its administrator manages its own operations.' : 'Organization administrator assigned. Platform access remains separate.');
      await load();
    } catch (problem) {
      setError((problem as Error).message);
    } finally {setBusy(false);}
  }

  return <div className="platform-shell"><header><div className="brand"><span className="brandmark">A</span><div>AQODH<small>PLATFORM ADMINISTRATION</small></div></div><span className="pill"><ShieldCheck size={15}/>Platform administrator</span><button onClick={load} disabled={loading} aria-label="Refresh platform directory"><RefreshCw size={17}/></button></header><main className="platform-content">
    <div className="eyebrow">PLATFORM WORKSPACE</div><h1>Give each organization its own space.</h1><p>Welcome, {displayName}. Register organizations and assign their administrators. Each organization manages its own members, meetings, lending and money.</p>
    <div className="notice"><ShieldCheck size={24}/><div><b>Platform administration is separate</b><p>This role cannot open organization workspaces, view member or financial records, approve loans or record transactions.</p></div></div>
    {error && <div className="error feedback" role="alert"><AlertCircle size={20}/><span>{error}</span></div>}
    {notice && <div className="success feedback" role="status"><CheckCircle2 size={20}/><span>{notice}</span></div>}
    <section className="panel report"><div className="panel-heading"><h2><Building2 size={19}/> Organization directory</h2><span className="pill">{loading ? 'Loading directory…' : state.organizations.length + ' registered'}</span></div><div className="table-scroll"><table><thead><tr><th>Organization</th><th>Assigned tier</th><th>Organization administrators</th></tr></thead><tbody>{state.organizations.map(organization => <tr key={organization.id}><td>{organization.name}</td><td>Tier {organization.tier} · {tierNames[organization.tier]}</td><td>{state.administrators.filter(admin => admin.tenant === organization.id).map(admin => admin.email).join(', ') || 'Administrator assignment needed'}</td></tr>)}</tbody></table></div>{!loading && !state.organizations.length && <div className="empty"><Building2 size={32}/><p>Register an organization and assign a separate administrator to get started.</p></div>}</section>
    <div className="dashboard-grid"><section className="panel report"><div className="panel-heading"><h2><Plus size={19}/> Register an organization</h2></div><div className="tool-content"><form className="group-form" onChange={() => {registerKey.current = crypto.randomUUID();}} onSubmit={event => save(event, 'registerOrganization', registerKey)}><fieldset disabled={busy}><label>Organization name<input name="name" required maxLength={200}/></label><label>Assigned tier<select name="tier"><option value="1">Tier 1 — Community Groups</option><option value="2">Tier 2 — Digital SACCO</option><option value="3">Tier 3 — Intelligent Finance</option></select></label><label>Organization administrator email<input name="administratorEmail" type="email" required maxLength={200}/></label><p>Use a different person's organization account. Platform administrators cannot be assigned this access.</p><button className="primary">Register organization</button></fieldset></form></div></section>
    <section className="panel report"><div className="panel-heading"><h2>Assign an organization administrator</h2></div><div className="tool-content"><p>This grants organization administration only. It does not grant platform access or send an invitation message. Existing assignments are retained.</p><form className="group-form" onChange={() => {assignKey.current = crypto.randomUUID();}} onSubmit={event => save(event, 'assignAdministrator', assignKey)}><fieldset disabled={busy}><label>Organization<select name="organization" required><option value="">Choose an organization</option>{state.organizations.map(organization => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label><label>Administrator email<input name="administratorEmail" type="email" required maxLength={200}/></label><button>Assign organization administrator</button></fieldset></form></div></section></div>
    <section className="panel report"><div className="panel-heading"><h2>Platform administration history</h2></div><div className="tool-content">{state.audit.length ? state.audit.map(event => <div className="access-row" key={event.id}><span>{event.action === 'registerOrganization' ? 'Organization registered' : event.action === 'assignAdministrator' ? 'Organization administrator assigned' : 'Platform role configured'}</span><small>{new Date(event.created).toLocaleString()}</small></div>) : <p>No platform actions recorded yet. Organization activity is not shown here.</p>}</div></section>
  </main><footer>AQODH · Platform administration<span>Organization operations stay with organization teams</span></footer></div>;
}
