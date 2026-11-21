const definition = require('./posthog-dashboard-definition.cjs');
async function provision({ host, projectId, key, apply = false, verify = false, fetchImpl = fetch }) {
  if (!apply && !verify) return { dryRun: true, dashboard: definition.name, insights: definition.insights.map(item => item.name) };
  const base = new URL(host || 'https://us.posthog.com');
  if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('POSTHOG_API_HOST must be an HTTPS origin without credentials or paths.');
  if (!/^\d+$/.test(String(projectId || '')) || !key) throw new Error('Set POSTHOG_PROJECT_ID and POSTHOG_PERSONAL_API_KEY outside the extension build.');
  const prefix = `/api/projects/${projectId}/`;
  async function request(path, method = 'GET', body) {
    const url = new URL(path, base);
    if (url.origin !== base.origin || !url.pathname.startsWith(prefix)) throw new Error('Unexpected API pagination URL.');
    const response = await fetchImpl(url.href, { method, redirect: 'error', signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw new Error(`PostHog API ${method} failed (HTTP ${response.status}); check project permissions. Response details suppressed.`);
    return response.json();
  }
  if (verify) {
    const data = await request(`${prefix}query/`, 'POST', { query: definition.verificationQuery, name: 'Delight v2 aggregate ingestion verification' });
    return { verified: Array.isArray(data.results) && data.results.length > 0, columns: data.columns, results: data.results };
  }
  // Validate every query before making dashboard changes. This also checks project access.
  for (const item of definition.insights) await request(`${prefix}query/`, 'POST', { query: item.query.source, name: `Validate Delight insight: ${item.key}` });
  const dashboards = [];
  let next = `${prefix}dashboards/`;
  while (next) { const page = await request(next); dashboards.push(...(page.results || [])); next = page.next; }
  const matches = dashboards.filter(item => !item.deleted && item.name === definition.name && item.tags?.includes(definition.tag));
  if (matches.length > 1) throw new Error('Multiple managed Delight dashboards found; resolve the duplicate before applying.');
  const dashboard = matches[0] || await request(`${prefix}dashboards/`, 'POST', { name: definition.name, description: definition.description, tags: [definition.tag] });
  const saved = await request(`${prefix}dashboards/${dashboard.id}/`);
  const existing = new Set((saved.tiles || []).filter(tile => !tile.deleted).map(tile => tile.insight?.description));
  let created = 0;
  for (const item of definition.insights) {
    const marker = `${definition.tag}:${item.key}`;
    if (existing.has(marker)) continue;
    await request(`${prefix}insights/`, 'POST', { name: item.name, description: marker, query: item.query, dashboards: [dashboard.id], tags: [definition.tag] });
    created++;
  }
  return { dashboardUrl: `${base.origin}/project/${projectId}/dashboard/${dashboard.id}`, createdInsights: created, existingInsights: definition.insights.length - created };
}
module.exports = { provision };
if (require.main === module) {
  provision({ host: process.env.POSTHOG_API_HOST, projectId: process.env.POSTHOG_PROJECT_ID, key: process.env.POSTHOG_PERSONAL_API_KEY, apply: process.argv.includes('--apply'), verify: process.argv.includes('--verify') })
    .then(result => { console.log(JSON.stringify(result, null, 2)); if (result.verified === false) process.exitCode = 2; })
    .catch(error => { console.error(error.message.startsWith('PostHog') || error.message.startsWith('Set ') || error.message.startsWith('Multiple ') ? error.message : 'PostHog operation failed. Check the API host, permissions, and network. No credentials or response bodies are printed.'); process.exitCode = 1; });
}
