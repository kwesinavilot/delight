const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function audit() {
  const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const pkg = read('package.json'), lock = read('package-lock.json');
  const manifest = read('dist/manifest.json'), source = read('public/manifest.json');
  const fail = message => { throw new Error(`Release audit: ${message}`); };
  if ([lock.version, lock.packages[''].version, manifest.version, source.version].some(version => version !== pkg.version)) fail('package, lockfile and source/built manifest versions disagree');
  if (JSON.stringify(manifest) !== JSON.stringify(source)) fail('built manifest is stale');
  if (!fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').includes(`## [${pkg.version}]`)) fail('release version is absent from changelog');
  const allowed = ['sidePanel', 'activeTab', 'scripting', 'storage', 'tabs', 'debugger', 'contextMenus'];
  if (manifest.permissions.some(permission => !allowed.includes(permission))) fail('unexpected permission; review justification before packaging');
  if (JSON.stringify(manifest.host_permissions) !== JSON.stringify(['http://*/*', 'https://*/*'])) fail('host permissions changed; review them');
  if (manifest.web_accessible_resources?.length) fail('unexpected web-accessible resources');
  const csp = manifest.content_security_policy.extension_pages;
  if (!csp.startsWith("script-src 'self';") || /unsafe-eval|unsafe-inline/.test(csp)) fail('unsafe extension script CSP');
  const dist = path.join(root, 'dist');
  const files = [];
  const walk = directory => { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) fail('symlink in package');
    if (entry.isDirectory()) walk(file); else files.push(file);
  } };
  walk(dist);
  for (const file of files) {
    const name = path.relative(dist, file);
    if (/(^|[\\/])\.|\.(map|ts|tsx|pem|key|zip)$/i.test(name) || /(^|[\\/])(node_modules|tests|releases)[\\/]/.test(name)) fail(`unexpected private/source artifact: ${name}`);
    if (/\.(js|html|json)$/.test(name)) {
      const text = fs.readFileSync(file, 'utf8');
      if (/<script\b[^>]*\bsrc\s*=\s*["']https?:/i.test(text)) fail(`remote script tag in ${name}`);
      if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-proj-|gsk_|AIza)[A-Za-z0-9_-]{30,}|\bsk-[A-Za-z0-9_-]{32,}/.test(text)) fail(`possible credential in ${name}; inspect locally (not printed)`);
    }
  }
  const entries = [manifest.background.service_worker, manifest.side_panel.default_path, 'automation-runtime.js',
    ...manifest.content_scripts.flatMap(script => script.js), ...Object.values(manifest.icons)];
  for (const entry of entries) if (!fs.existsSync(path.join(dist, entry))) fail(`missing entry: ${entry}`);
  console.log(`PASS: release ${pkg.version}, ${files.length} packaged files; versions, permissions, CSP, entries and artifact checks. Store approval/public policy/live-site review remain manual.`);
  return { root, dist, version: pkg.version, files };
}
module.exports = audit;
if (require.main === module) audit();
