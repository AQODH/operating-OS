import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {getPlatformRole, requirePlatformAdmin, listOrganizationAccess} from '../lib/platform-roles.mjs';
import {requireTenant} from '../lib/tenancy.mjs';
import {authorize} from '../lib/authorization.mjs';
import {mutatePlatform, readPlatform} from '../lib/platform-admin.mjs';
import {mutateDigital} from '../lib/digital-server.ts';

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of fs.readdirSync('drizzle').filter(file => file.endsWith('.sql')).sort()) {
    sqlite.exec(fs.readFileSync('drizzle/' + file, 'utf8'));
  }
  const db = {
    prepare(sql) {
      let values = [];
      const statement = {
        sql,
        get values() {return values;},
        bind(...input) {values = input; return statement;},
        async first() {return sqlite.prepare(sql).get(...values) ?? null;},
        async all() {return {results: sqlite.prepare(sql).all(...values)};},
      };
      return statement;
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = statements.map(statement => sqlite.prepare(statement.sql).run(...statement.values));
        sqlite.exec('COMMIT');
        return results;
      } catch (problem) {
        sqlite.exec('ROLLBACK');
        throw problem;
      }
    },
  };
  const platform = {userId: 'system', email: 'platform@example.test'};
  const admin = {userId: 'org-admin', email: 'admin@example.test'};
  sqlite.prepare('INSERT INTO platform_roles VALUES(?,?,?,?)').run(platform.userId, platform.email, 'platform_admin', 'now');
  const register = (extra = {}) => mutatePlatform(db, platform, {
    action: 'registerOrganization', key: crypto.randomUUID(), name: 'Synthetic organization',
    tier: 2, administratorEmail: admin.email, ...extra,
  });
  return {sqlite, db, platform, admin, register};
}

test('platform registration gives a separate organization administrator access and no creator ownership', async () => {
  const f = fixture();
  const organization = await f.register();
  assert.equal((await requireTenant(f.db, f.admin, organization.id)).role, 'organization_admin');
  const row = f.sqlite.prepare('SELECT owner FROM organizations WHERE id=?').get(organization.id);
  assert.notEqual(row.owner, f.platform.userId);
  await assert.rejects(requireTenant(f.db, f.platform, organization.id), /Platform administrators cannot/);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM transactions').get().n, 0);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM records').get().n, 0);
  f.sqlite.close();
});

test('platform denial takes precedence over legacy ownership, organization membership and client role claims', async () => {
  const f = fixture();
  const organization = await f.register();
  f.sqlite.prepare('UPDATE organizations SET owner=? WHERE id=?').run(f.platform.userId, organization.id);
  f.sqlite.prepare('INSERT INTO memberships VALUES(?,?,?,?,?)').run('stale', organization.id, f.platform.email, 'organization_admin', 'now');
  await assert.rejects(requireTenant(f.db, {...f.platform, role: 'organization_admin'}, organization.id), /Platform administrators cannot/);
  await assert.rejects(listOrganizationAccess(f.db, f.platform), /Platform administrators cannot/);
  await assert.rejects(mutateDigital(f.db, organization.id,
    {role: 'organization_admin', organization: {tier: 2}}, f.platform,
    {action: 'digitalMember', key: 'forged-context', name: 'Forbidden member'}), /Platform administrators cannot/);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM records').get().n, 0);
  f.sqlite.close();
});

test('organization users cannot access platform controls or promote themselves through request fields', async () => {
  const f = fixture();
  await f.register();
  assert.equal(await getPlatformRole(f.db, {...f.admin, role: 'platform_admin'}), null);
  await assert.rejects(requirePlatformAdmin(f.db, f.admin));
  await assert.rejects(readPlatform(f.db, f.admin));
  await assert.rejects(mutatePlatform(f.db, {...f.admin, role: 'platform_admin'}, {
    action: 'registerOrganization', key: 'no', name: 'Unauthorized', tier: 1,
    administratorEmail: 'other@example.test',
  }));
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM organizations').get().n, 1);
  f.sqlite.close();
});

test('platform assignments cannot grant organization access to a platform identity', async () => {
  const f = fixture();
  const organization = await f.register();
  await assert.rejects(f.register({administratorEmail: f.platform.email.toUpperCase()}), /cannot be assigned/);
  f.sqlite.prepare('INSERT INTO platform_roles VALUES(?,?,?,?)').run('second-system', 'second@example.test', 'platform_admin', 'now');
  await assert.rejects(mutatePlatform(f.db, f.platform, {
    action: 'assignAdministrator', key: 'no-self', organization: organization.id,
    administratorEmail: 'SECOND@example.test',
  }), /cannot be assigned/);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM memberships').get().n, 1);
  f.sqlite.close();
});

test('platform directory contains registration metadata, not member, ledger or organization audit data', async () => {
  const f = fixture();
  const organization = await f.register();
  f.sqlite.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,?)').run('member', organization.id, 'member', 'PRIVATE_MEMBER_NAME', '{}', 1, 'now');
  const directory = await readPlatform(f.db, f.platform);
  assert.deepEqual(Object.keys(directory.organizations[0]).sort(), ['created', 'id', 'name', 'tier']);
  assert(!JSON.stringify(directory).includes('PRIVATE_MEMBER_NAME'));
  for (const key of ['records', 'transactions', 'entries', 'memberships']) assert.equal(directory[key], undefined);
  f.sqlite.close();
});

test('platform registration validates one tier and replays an identical request without duplicating organizations', async () => {
  const f = fixture();
  for (const tier of [[1, 2], '2', 0, 4]) await assert.rejects(f.register({tier}));
  const payload = {key: 'same-registration'};
  const first = await f.register(payload);
  const second = await f.register(payload);
  assert.equal(second.id, first.id);
  assert.equal(second.duplicate, true);
  await assert.rejects(f.register({...payload, name: 'Changed payload'}), /already used/);
  await assert.rejects(f.register({role: 'organization_admin'}), /Unsupported/);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM organizations').get().n, 1);
  f.sqlite.close();
});

test('organization administrator assignments stay tenant-scoped and platform audit cannot be rewritten', async () => {
  const f = fixture();
  const first = await f.register();
  const second = await f.register({administratorEmail: 'other@example.test'});
  assert.deepEqual((await listOrganizationAccess(f.db, f.admin)).map(row => row.id), [first.id]);
  await assert.rejects(requireTenant(f.db, f.admin, second.id));
  assert.throws(() => f.sqlite.exec("UPDATE platform_audit SET action='hidden'"), /immutable/);
  assert.throws(() => f.sqlite.exec('DELETE FROM platform_audit'), /immutable/);
  f.sqlite.close();
});

test('role rights reject platform and obsolete owner roles for every organization action', () => {
  for (const action of ['read', 'create', 'post', 'approve', 'invite']) {
    authorize('organization_admin', action);
    assert.throws(() => authorize('platform_admin', action));
    assert.throws(() => authorize('owner', action));
  }
});

test('organization administrators cannot grant a platform account staff or member access', async () => {
  const f = fixture();
  const organization = await f.register();
  await assert.rejects(mutateDigital(f.db, organization.id, {}, f.admin, {
    action: 'digitalAccess', key: 'no-platform-invite', email: f.platform.email,
    role: 'officer',
  }), /cannot be assigned organization roles/);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM memberships').get().n, 1);
  f.sqlite.close();
});

test('promotion to platform role blocks replay of an earlier organization command', async () => {
  const f = fixture();
  const organization = await f.register();
  const command = {action: 'digitalMember', key: 'before-promotion', name: 'Synthetic member'};
  await mutateDigital(f.db, organization.id, {}, f.admin, command);
  f.sqlite.prepare('INSERT INTO platform_roles VALUES(?,?,?,?)')
    .run(f.admin.userId, f.admin.email, 'platform_admin', 'later');
  await assert.rejects(mutateDigital(f.db, organization.id,
    {role: 'organization_admin'}, f.admin, command), /Platform administrators cannot/);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM records WHERE kind='member'").get().n, 1);
  f.sqlite.close();
});

test('tenant team management cannot demote or revoke platform-assigned organization administrators', async () => {
  const f = fixture();
  const organization = await f.register();
  await assert.rejects(mutateDigital(f.db, organization.id, {}, f.admin, {
    action: 'digitalAccess', key: 'no-self-demotion', email: f.admin.email, role: 'viewer',
  }), /managed through platform administration/);
  await assert.rejects(mutateDigital(f.db, organization.id, {}, f.admin, {
    action: 'digitalRevoke', key: 'no-admin-revoke', email: f.admin.email,
  }), /managed through platform administration/);
  assert.equal((await requireTenant(f.db, f.admin, organization.id)).role, 'organization_admin');
  f.sqlite.close();
});
