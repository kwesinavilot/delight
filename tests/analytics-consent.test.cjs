const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function setup(initial = false) {
  const disk = { analyticsOptIn: initial }, listeners = [], captures = [], inits = [];
  const sdk = { init: (_key, options) => { inits.push(options); options.loaded(sdk); }, capture: (...args) => captures.push(args),
    opt_in_capturing() {}, opt_out_capturing() {}, reset() {}, debug() {} };
  global.chrome = { runtime: { getManifest: () => ({ version: 'test' }) }, storage: {
    onChanged: { addListener: listener => listeners.push(listener) },
    local: { get: async () => ({ ...disk }), set: async value => { Object.assign(disk, value); for (const listener of listeners) listener({ analyticsOptIn: { newValue: disk.analyticsOptIn } }, 'local'); } }
  } };
  const code = ts.transpileModule(fs.readFileSync('src/services/PostHogService.ts', 'utf8').replaceAll('import.meta.env.', 'buildEnv.'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'buildEnv', code)(() => sdk, module, module.exports,
    { VITE_PUBLIC_POSTHOG_KEY: 'phc_fixture', VITE_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com', DEV: false });
  return { service: module.exports.default, inits, captures, listeners, disk };
}
test('analytics never initializes or captures without affirmative local consent', async () => {
  const ctx = setup();
  ctx.service.initialize();
  await new Promise(resolve => setImmediate(resolve));
  ctx.service.trackPage('sidepanel');
  assert.equal(ctx.inits.length, 0);
  assert.equal(ctx.captures.length, 0);
});
test('opt-in uses privacy defaults and opt-out prevents subsequent captures across contexts', async () => {
  const ctx = setup();
  await ctx.service.setEnabled(true);
  assert.equal(ctx.inits.length, 1);
  assert.equal(ctx.inits[0].autocapture, false);
  assert.equal(ctx.inits[0].disable_external_dependency_loading, true);
  assert.equal(ctx.inits[0].capture_pageleave, false);
  ctx.service.trackPage('sidepanel');
  assert.equal(ctx.captures.length, 1);
  assert.ok(!('$current_url' in ctx.captures[0][1]));
  ctx.service.trackAgentAutomation('private task contents', true);
  assert.equal(ctx.captures[1][1].task_type, 'other');
  for (const listener of ctx.listeners) listener({ analyticsOptIn: { newValue: false } }, 'local');
  ctx.service.trackPage('blocked');
  assert.equal(ctx.captures.length, 2);
});
