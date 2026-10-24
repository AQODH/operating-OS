import {requireOrganizationActor} from './platform-roles.mjs';

/** Resolve organization access after denying the platform role, including legacy owner assignments. */
export async function requireTenant(db, user, tenant) {
  await requireOrganizationActor(db, user);
  if (typeof tenant !== 'string' || !tenant) throw Error('Choose an organization to continue.');
  const organization = await db.prepare(
    'SELECT id,owner,name,tier FROM organizations WHERE id=?'
  ).bind(tenant).first();
  if (!organization) throw Error('This organization is unavailable or you do not have access.');
  if (organization.owner === user.userId) return {organization, role: 'organization_admin'};
  const membership = await db.prepare(
    'SELECT role FROM memberships WHERE tenant=? AND email=?'
  ).bind(tenant, user.email.toLowerCase()).first();
  if (!membership || !['organization_admin', 'officer', 'treasurer', 'viewer', 'member'].includes(membership.role)) {
    throw Error('This organization is unavailable or you do not have access.');
  }
  if (membership.role !== 'member') return {organization, role: membership.role};
  if (![2, 3].includes(organization.tier)) throw Error('Member portal requires digital finance');
  const link = await db.prepare(
    "SELECT json_extract(data,'$.member') member FROM records WHERE tenant=? AND kind='portal_access' AND json_extract(data,'$.email')=?"
  ).bind(tenant, user.email.toLowerCase()).first();
  if (!link?.member) throw Error('Ask your organization administrator to link your member account');
  const member = await db.prepare(
    "SELECT id FROM records WHERE id=? AND tenant=? AND kind='member'"
  ).bind(link.member, tenant).first();
  if (!member) throw Error('Member account unavailable');
  return {organization, role: 'member', memberId: member.id};
}
