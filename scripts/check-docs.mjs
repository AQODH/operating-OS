import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const excludedDirectories = new Set([
  'node_modules', 'dist', '.git', '.next', '.vinext', '.wrangler',
  '.sites-runtime', 'work', 'outputs',
]);
const markdownFiles = [];
const failures = [];
let localLinksChecked = 0;

function collectMarkdown(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (excludedDirectories.has(entry.name) || entry.isSymbolicLink()) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collectMarkdown(file);
    else if (entry.name.endsWith('.md')) markdownFiles.push(file);
  }
}

function checkLocalLinks(file) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim();
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    // Support the repository's inline links, including optional quoted titles.
    target = target.startsWith('<')
      ? target.slice(1, target.indexOf('>'))
      : target.replace(/\s+["'][^"']*["']\s*$/, '');
    target = target.split('#')[0];
    if (!target) continue;
    localLinksChecked++;
    let decoded;
    try {
      decoded = decodeURIComponent(target);
    } catch {
      failures.push(path.relative(root, file) + ': invalid URL encoding');
      continue;
    }
    if (!fs.existsSync(path.resolve(path.dirname(file), decoded))) {
      failures.push(path.relative(root, file) + ': missing ' + target);
    }
  }
  if (content.includes('`n`n')) {
    failures.push(path.relative(root, file) + ': literal escaped newlines');
  }
}

collectMarkdown(root);
for (const file of markdownFiles) checkLocalLinks(file);

const packageInfo = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const script of ['dev', 'build', 'test', 'check', 'doctor', 'docs:check']) {
  if (!packageInfo.scripts[script]) failures.push('Missing npm script: ' + script);
}

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const migrations = fs.readdirSync(path.join(root, 'drizzle'))
  .filter(file => file.endsWith('.sql')).sort();
let previousPosition = -1;
for (const file of migrations) {
  const position = readme.indexOf(file);
  if (position < 0 || position <= previousPosition) {
    failures.push('README migration missing/out of order: ' + file);
  }
  previousPosition = position;
}

const implementationPaths = [
  'app/page.tsx', 'app/tier-one-workspace.tsx', 'app/digital-workspace.tsx',
  'app/api/workspace/route.ts', 'app/api/meetings/route.ts',
  'app/api/attachments/route.ts', 'lib/tenancy.mjs', 'lib/authorization.mjs',
  'lib/finance/core.mjs', 'lib/tier-one.mjs', 'lib/digital-server.ts',
  'lib/digital.mjs', 'db/schema.ts', 'scripts/tier-one-cycle-test.mjs',
  'scripts/digital-trial-test.mjs', 'scripts/recovery-drill.mjs',
  '.github/workflows/verify.yml',
  'app/platform-workspace.tsx', 'app/api/platform/route.ts',
  'lib/platform-roles.mjs', 'lib/platform-admin.mjs',
  'scripts/seed-local-roles.mjs', 'scripts/platform-boundary-test.mjs',
  'scripts/local-role-fixtures.mjs',
];
for (const file of implementationPaths) {
  if (!fs.existsSync(path.join(root, file))) failures.push('Missing documented implementation: ' + file);
}

console.log(JSON.stringify({
  markdownFiles: markdownFiles.length,
  localLinksChecked,
  implementationPathsChecked: implementationPaths.length,
  migrationsChecked: migrations.length,
  failures,
}, null, 2));
if (failures.length) process.exitCode = 1;
