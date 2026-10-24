import {executeLocalFixture, sqlText} from './local-role-fixtures.mjs';
const mode = process.argv[2];
if (!['platform', 'organization'].includes(mode)) throw Error('Usage: node scripts/seed-local-roles.mjs platform|organization. Local development only.');
const now = sqlText(new Date().toISOString());
if (mode === 'platform') {
  executeLocalFixture(`
    INSERT INTO platform_roles(user_id,email,role,created) VALUES('local_seedy','seedy@sites.test','platform_admin',${now}) ON CONFLICT(user_id) DO NOTHING;
    INSERT INTO guards(id,ok) VALUES(${sqlText(crypto.randomUUID())},(SELECT COUNT(*)=1 FROM platform_roles WHERE user_id='local_seedy' AND email='seedy@sites.test' AND role='platform_admin'));
    INSERT OR IGNORE INTO platform_audit(id,actor,action,target,created) VALUES('local-preview:platform-role','local-development-setup','local platform role seeded','local_seedy',${now});
  `);
  console.log('Local development identity now has platform-only administration. Existing organization operations are denied, including legacy ownership.');
} else {
  let sql = `INSERT INTO guards(id,ok) VALUES(${sqlText(crypto.randomUUID())},(SELECT COUNT(*)=0 FROM platform_roles WHERE user_id='local_seedy' OR email='seedy@sites.test'));\n`;
  for (const tier of [1, 2, 3]) {
    const id = 'local-organization-preview-tier-' + tier;
    sql += `INSERT OR IGNORE INTO organizations(id,owner,name,created,tier) VALUES(${sqlText(id)},${sqlText('unassigned:' + id)},${sqlText('Organization role preview — Tier ' + tier)},${now},${tier});\n`;
    sql += `INSERT INTO memberships(id,tenant,email,role,created) VALUES(${sqlText('local-admin-preview-' + tier)},${sqlText(id)},'seedy@sites.test','organization_admin',${now}) ON CONFLICT(tenant,email) DO NOTHING;\n`;
  }
  executeLocalFixture(sql);
  console.log('Synthetic organization-admin previews prepared for all tiers. This command refuses a database where the current identity is a platform administrator. No platform role was granted.');
}
