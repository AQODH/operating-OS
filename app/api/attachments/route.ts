import { requireTenant } from '../../../lib/tenancy.mjs';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { authorize } from '../../../lib/authorization.mjs';
async function access(req: Request) { const user = await getChatGPTUser(); if (!user || !env.DB || !env.BUCKET)
    throw Error('Sign in and storage are required'); const tenant = new URL(req.url).searchParams.get('tenant'); const { role } = await requireTenant(env.DB, user, tenant); if(role==='member')throw Error('Evidence files are available to organization staff only'); return { user, tenant, role, db: env.DB, bucket: env.BUCKET }; }
export async function POST(req: Request) { try {
    if (req.headers.get('origin') !== new URL(req.url).origin)
        throw Error('Invalid origin');
    const { user, tenant, role, db, bucket } = await access(req);
    authorize(role, 'create');
    const form = await req.formData();
    const file = form.get('file');
    const source = form.get('source');
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024 || file.size === 0)
        throw Error('Choose a file up to 5 MB');
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];
    if (!allowed.includes(file.type))
        throw Error('Supported files: PDF, PNG, JPEG, text');
    const target: any = await db.prepare('SELECT id FROM records WHERE id=? AND tenant=?').bind(source, tenant).first();
    if (!target)
        throw Error('Select a record in this organization');
    const id = crypto.randomUUID(), key = tenant + '/' + id, now = new Date().toISOString();
    await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    try {
        await db.batch([db.prepare('INSERT INTO records(id,tenant,kind,name,data,version,created) VALUES(?,?,?,?,?,1,?)').bind(id, tenant, 'attachment', file.name.slice(0, 180), JSON.stringify({ source, key, type: file.type, size: file.size }), now), db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(), tenant, user.userId, 'upload evidence', id, now)]);
    }
    catch (e) {
        await bucket.delete(key);
        throw e;
    }
    return privateJSON({ id });
}
catch (e) {
    return privateJSON({ error: (e as Error).message }, { status: 400 });
} }
export async function GET(req: Request) { try {
    const { tenant, db, bucket } = await access(req);
    const id = new URL(req.url).searchParams.get('id');
    const record: any = await db.prepare("SELECT * FROM records WHERE id=? AND tenant=? AND kind='attachment'").bind(id, tenant).first();
    if (!record)
        throw Error('File not found');
    const data = JSON.parse(record.data);
    const file = await bucket.get(data.key);
    if (!file)
        throw Error('File not found');
    return new Response(file.body, { headers: { 'Content-Type': data.type, 'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(record.name), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'private, no-store' } });
}
catch (e) {
    return privateJSON({ error: (e as Error).message }, { status: 403 });
} }

function privateJSON(data:any,init:ResponseInit={}){return Response.json(data,{...init,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}

