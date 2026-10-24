import {localTestBase} from './local-role-fixtures.mjs';
const base = localTestBase();
const login = await fetch(base + '/signin-with-chatgpt?return_to=/', {redirect: 'manual'});
const cookie = login.headers.get('set-cookie')?.split(';')[0];
if (!cookie) throw Error('Start a portable local preview seeded with the platform role.');
const headers = {cookie, origin: base, 'Content-Type': 'application/json'};
async function request(api, status, body) {
  const response = await fetch(base + '/api/' + api, {
    headers, method: body ? 'POST' : 'GET', body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (response.status !== status) throw Error(api + ': expected ' + status + ', received ' + response.status);
  if (status >= 400 && !data.error?.includes('Platform administrators cannot')) {
    throw Error(api + ': organization-role boundary did not produce the expected denial');
  }
  return data;
}
const directory = await request('platform', 200);
if (directory.role !== 'platform_admin') throw Error('Platform preview role not active.');
const tenant = directory.organizations[0]?.id || 'missing-organization';
await request('workspace', 403);
await request('workspace?tenant=' + tenant, 403);
for (const action of ['create', 'post', 'invite', 'reverse', 'digitalMember', 'digitalLoan', 'digitalPolicy', 'digitalAccess']) {
  await request('workspace?tenant=' + tenant, 400, {action, key: crypto.randomUUID()});
}
await request('meetings?tenant=' + tenant, 400, {action: 'openMeeting'});
await request('attachments?tenant=' + tenant + '&id=missing', 403);
await request('attachments?tenant=' + tenant, 400, {source: 'missing'});
if ('records' in directory || 'entries' in directory || 'transactions' in directory) throw Error('Operational data leaked into platform directory.');
console.log(JSON.stringify({platformDirectory:true,workspaceReadDenied:true,organizationActionsDenied:8,meetingDenied:true,evidenceReadWriteDenied:true,operationalDataAbsent:true}));
