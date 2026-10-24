import {requirePlatformAdmin} from './platform-roles.mjs';

function requiredText(value, limit = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) {
    throw Error('Required text is missing or too long.');
  }
  return value.trim();
}

async function administratorEmail(db, user, value) {
  const email = requiredText(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('Enter a valid organization administrator email.');
  const platformAssignment = await db.prepare('SELECT user_id FROM platform_roles WHERE email=?').bind(email).first();
  if (email === user.email.toLowerCase() || platformAssignment) {
    throw Error('A platform administrator cannot be assigned organization administrator access.');
  }
  return email;
}

export async function readPlatform(db, user) {
  await requirePlatformAdmin(db, user);
  const organizations = (await db.prepare(
    'SELECT id,name,tier,created FROM organizations ORDER BY created DESC,id DESC'
  ).all()).results;
  const administrators = (await db.prepare(
    "SELECT tenant,email FROM memberships WHERE role='organization_admin' ORDER BY tenant,email"
  ).all()).results;
  const audit = (await db.prepare(
    'SELECT id,action,created FROM platform_audit ORDER BY created DESC LIMIT 100'
  ).all()).results;
  return {role: 'platform_admin', organizations, administrators, audit};
}

export async function mutatePlatform(db, user, body) {
  await requirePlatformAdmin(db, user);
  if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 3000) {
    throw Error('Invalid platform request.');
  }
  const actions = {
    registerOrganization: ['action', 'key', 'name', 'tier', 'administratorEmail'],
    assignAdministrator: ['action', 'key', 'organization', 'administratorEmail'],
  };
  const fields = actions[body.action];
  if (!fields || Object.keys(body).some(key => !fields.includes(key))) throw Error('Unsupported platform action or field.');
  const key = requiredText(body.key, 100);
  const receiptId = 'platform:' + JSON.stringify([user.userId, key]);
  const fingerprint = JSON.stringify(body);
  const prior = await db.prepare('SELECT actor,target FROM platform_audit WHERE id=?').bind(receiptId).first();
  if (prior) {
    const receipt = JSON.parse(prior.target);
    if (prior.actor !== user.userId || receipt.fingerprint !== fingerprint) throw Error('Request key is already used for another platform action.');
    return {...receipt.result, duplicate: true};
  }
  const email = await administratorEmail(db, user, body.administratorEmail);
  const now = new Date().toISOString();
  const statements = [];
  let organization;
  if (body.action === 'registerOrganization') {
    if (!Number.isInteger(body.tier) || ![1, 2, 3].includes(body.tier)) throw Error('Select exactly one organization tier.');
    organization = crypto.randomUUID();
    statements.push(db.prepare(
      'INSERT INTO organizations(id,owner,name,created,tier) VALUES(?,?,?,?,?)'
    ).bind(organization, 'unassigned:' + organization, requiredText(body.name), now, body.tier));
  } else {
    organization = requiredText(body.organization, 100);
    if (!await db.prepare('SELECT id FROM organizations WHERE id=?').bind(organization).first()) {
      throw Error('Organization registration not found.');
    }
  }
  statements.push(db.prepare(
    "INSERT INTO memberships(id,tenant,email,role,created) VALUES(?,?,?,'organization_admin',?) ON CONFLICT(tenant,email) DO UPDATE SET role=excluded.role"
  ).bind(crypto.randomUUID(), organization, email, now));
  const result = {id: organization, ok: true};
  statements.push(db.prepare(
    'INSERT INTO platform_audit(id,actor,action,target,created) VALUES(?,?,?,?,?)'
  ).bind(receiptId, user.userId, body.action, JSON.stringify({organization, administratorEmail: email, fingerprint, result}), now));
  await db.batch(statements);
  return result;
}
