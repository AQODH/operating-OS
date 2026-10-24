import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const fixtureUserId = 'local_seedy';
const fixtureEmail = 'seedy@sites.test';
export function sqlText(value) {return "'" + String(value).replaceAll("'", "''") + "'";}

export function executeLocalFixture(sql) {
  const work = path.join(projectRoot, 'work', 'role-fixtures');
  fs.mkdirSync(work, {recursive: true});
  const file = path.join(work, crypto.randomUUID() + '.sql');
  fs.writeFileSync(file, sql);
  const command = spawnSync(process.execPath, [
    '--import', './scripts/sites-env.mjs', './node_modules/wrangler/bin/wrangler.js',
    'd1', 'execute', 'DB', '--local', '--config', 'dist/server/wrangler.json',
    '--persist-to', '.wrangler/state', '--file', file,
  ], {cwd: projectRoot, encoding: 'utf8'});
  if (command.status !== 0) {
    throw Error('Local role fixture failed. Confirm migration 0007 and use an organization-preview database for workflow tests. ' +
      (command.stderr || command.stdout || command.error?.message || '').slice(-700));
  }
}

export function localTestBase() {
  const port = Number(process.env.AQODH_TEST_PORT || 5173);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Use a valid local test port.');
  return 'http://127.0.0.1:' + port;
}

/** Test-only metadata setup: never posts money and never grants platform privileges. */
export function createLocalWorkflowOrganization(name, tier = 1) {
  if (![1, 2, 3].includes(tier)) throw Error('Invalid fixture tier');
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  executeLocalFixture([
    `INSERT INTO guards(id,ok) VALUES(${sqlText(crypto.randomUUID())},(SELECT COUNT(*)=0 FROM platform_roles WHERE user_id=${sqlText(fixtureUserId)} OR email=${sqlText(fixtureEmail)}));`,
    `INSERT INTO organizations(id,owner,name,created,tier) VALUES(${sqlText(id)},${sqlText('unassigned:' + id)},${sqlText(name)},${sqlText(now)},${tier});`,
    `INSERT INTO memberships(id,tenant,email,role,created) VALUES(${sqlText(crypto.randomUUID())},${sqlText(id)},${sqlText(fixtureEmail)},'organization_admin',${sqlText(now)});`,
  ].join('\n'));
  return {id};
}
