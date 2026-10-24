import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
let failures = 0;
let warnings = 0;

function report(level, message) {
  console.log(level + ': ' + message);
  if (level === 'FAIL') failures++;
  if (level === 'WARN') warnings++;
}

const majorVersion = Number(process.versions.node.split('.')[0]);
report(majorVersion === 24 ? 'PASS' : majorVersion > 24 ? 'WARN' : 'FAIL',
  'Node ' + process.versions.node + '; supported team baseline is Node 24.');

for (const dependency of ['vinext', 'typescript', 'wrangler', 'drizzle-kit']) {
  const installed = fs.existsSync(path.join(root, 'node_modules', dependency, 'package.json'));
  report(installed ? 'PASS' : 'FAIL',
    'Dependency ' + dependency + ': ' + (installed ? 'installed.' : 'missing; run npm ci.'));
}

try {
  const hosting = JSON.parse(fs.readFileSync(path.join(root, '.openai/hosting.json'), 'utf8'));
  report(hosting.d1 === 'DB' && hosting.r2 === 'BUCKET' ? 'PASS' : 'FAIL',
    'Expected DB and BUCKET binding declarations.');
} catch {
  report('FAIL', 'Hosting manifest unreadable; restore the checked-in file.');
}

let profile = 'portable';
try {
  profile = JSON.parse(fs.readFileSync(
    path.join(root, '.sites-runtime/execution-profile.json'), 'utf8')).executionProfile;
} catch (error) {
  if (error.code !== 'ENOENT') report('FAIL', 'Local execution-profile JSON is invalid.');
}
const validProfile = ['portable', 'managed-linux'].includes(profile);
report(validProfile ? 'PASS' : 'FAIL',
  'Execution profile ' + (validProfile ? profile : 'invalid') +
  '. Only portable development provides loopback mock sign-in.');

const workerConfigExists = fs.existsSync(path.join(root, 'dist/server/wrangler.json'));
report(workerConfigExists ? 'PASS' : 'WARN', 'Generated Worker config ' +
  (workerConfigExists ? 'exists.' : 'missing; run npm run build before Wrangler commands.'));

async function inspectLocalSchema() {
  const state = path.join(root, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  if (majorVersion < 24 || !fs.existsSync(state)) {
    report('WARN', 'No local D1 schema inspected. Initialize a fresh local database using the documented migration order.');
    return;
  }
  const {DatabaseSync} = await import('node:sqlite');
  let databasesFound = 0;
  const candidates = fs.readdirSync(state).filter(file =>
    file.endsWith('.sqlite') && file !== 'metadata.sqlite');
  for (const file of candidates) {
    let database;
    try {
      database = new DatabaseSync(path.join(state, file), {readOnly: true});
      const tables = new Set(database.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name));
      if (!tables.has('organizations')) continue;
      databasesFound++;
      const required = ['records', 'transactions', 'entries', 'audit',
        'memberships', 'guards', 'seals', 'meeting_transactions', 'platform_roles', 'platform_audit'];
      const missing = required.filter(table => !tables.has(table));
      const columns = database.prepare('PRAGMA table_info(organizations)').all();
      if (!columns.some(column => column.name === 'tier')) missing.push('organizations.tier');
      const triggers = new Set(database.prepare(
        "SELECT name FROM sqlite_master WHERE type='trigger'").all().map(row => row.name));
      for (const trigger of ['guard_valid', 'platform_audit_no_update', 'platform_audit_no_delete']) {
        if (!triggers.has(trigger)) missing.push(trigger + ' trigger');
      }
      report(missing.length ? 'FAIL' : 'PASS', 'Local AQODH schema ' +
        (missing.length ? 'missing: ' + missing.join(', ') :
          'has required tables, tier column and role/ledger audit guard triggers.'));
    } catch {
      report('WARN', 'A local SQLite candidate could not be inspected; check access/locks without deleting state.');
    } finally {
      database?.close();
    }
  }
  if (!databasesFound) report('WARN', 'No initialized AQODH database found; follow fresh setup.');
  if (databasesFound > 1) report('WARN', 'Multiple AQODH databases found; verify runtime selection before migrations.');
}

await inspectLocalSchema();
console.log('Read-only diagnostic: no network calls, credential reads, money writes or migrations. ' +
  'It does not verify authentication, balances, complete schema equivalence, provider access or deployment.');
console.log('Summary: ' + failures + ' failures, ' + warnings + ' warnings.');
if (failures) process.exitCode = 1;
