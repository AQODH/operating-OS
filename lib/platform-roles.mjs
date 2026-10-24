/** Platform and organization permissions are deliberately disjoint. Identity is supplied by the existing stub/provider. */
export async function getPlatformRole(db, user) {
  if (!user?.userId || !user?.email) return null;
  const assignment = await db.prepare(
    'SELECT role FROM platform_roles WHERE user_id=? OR email=?'
  ).bind(user.userId, user.email.toLowerCase()).first();
  return assignment?.role === 'platform_admin' ? 'platform_admin' : null;
}

export async function requireOrganizationActor(db, user) {
  if (!user?.userId || !user?.email) throw Error('The current development identity is unavailable.');
  if (await getPlatformRole(db, user)) {
    throw Error('Platform administrators cannot access organization records or perform organization activities.');
  }
}

export async function requirePlatformAdmin(db, user) {
  if (await getPlatformRole(db, user) !== 'platform_admin') {
    throw Error('Platform administrator permission is required.');
  }
  return {role: 'platform_admin'};
}

export async function listOrganizationAccess(db, user) {
  await requireOrganizationActor(db, user);
  return (await db.prepare(
    'SELECT DISTINCT o.* FROM organizations o LEFT JOIN memberships m ON m.tenant=o.id WHERE o.owner=? OR m.email=? ORDER BY o.created'
  ).bind(user.userId, user.email.toLowerCase()).all()).results;
}

export async function requireOrganizationAssignee(db, email) {
  const platformAssignment = await db.prepare('SELECT user_id FROM platform_roles WHERE email=?')
    .bind(email.toLowerCase()).first();
  if (platformAssignment) throw Error('Platform administrators cannot be assigned organization roles.');
}

export async function requireManageableOrganizationMembership(db, tenant, email) {
  const membership = await db.prepare('SELECT role FROM memberships WHERE tenant=? AND email=?')
    .bind(tenant, email.toLowerCase()).first();
  if (membership?.role === 'organization_admin') {
    throw Error('Organization administrator assignments are managed through platform administration.');
  }
}
