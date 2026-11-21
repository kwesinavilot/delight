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
  return { service: module.exports.default, classify: module.exports.analyticsError, sdk, inits, captures, listeners, disk };
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

test('initial events wait for consent loading and are discarded instead of replayed after opting in', async () => {
  const optedIn = setup(true);
  optedIn.service.trackPage('sidepanel');
  assert.equal(optedIn.captures.length, 0);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(optedIn.captures.length, 1);
  const optedOut = setup(false);
  optedOut.service.trackPage('welcome');
  await new Promise(resolve => setImmediate(resolve));
  await optedOut.service.setEnabled(true);
  assert.equal(optedOut.captures.length, 0);
});
test('revoking consent defeats a late storage read and clears queued events', async () => {
  const ctx = setup(true);
  let resolve;
  chrome.storage.local.get = () => new Promise(done => { resolve = done; });
  ctx.service.trackPage('sidepanel');
  await ctx.service.setEnabled(false);
  resolve({analyticsOptIn:true});
  await new Promise(done => setImmediate(done));
  assert.equal(ctx.inits.length,0);
  assert.equal(ctx.captures.length,0);
});
test('event and SDK-level allowlists exclude user text, URLs, credentials, and profile setters', async () => {
  const ctx = setup();
  await ctx.service.setEnabled(true);
  ctx.service.track('provider_connection_tested',{provider:'groq',model:'person@example.com',error_category:'secret message',duration_ms:-1,prompt:'private prompt',url:'https://private.test',api_key:'secret-key'});
  const properties=ctx.captures[0][1];
  assert.equal(properties.model,'other');
  assert.equal(properties.error_category,'other');
  assert.equal(properties.duration_ms,undefined);
  assert.ok(!JSON.stringify(properties).includes('private'));
  const result=ctx.inits[0].before_send({uuid:'fixture',event:'provider_connection_tested',timestamp:new Date(),$set:{email:'person@example.com'},$set_once:{url:'private'},properties:{...properties,distinct_id:'fixture-id',$current_url:'https://private.test',$referrer:'https://private.test',$set:{name:'private'},unexpected:'private'}});
  assert.equal(result.properties.distinct_id,'fixture-id');
  assert.equal(result.properties.$process_person_profile,false);
  assert.equal(result.$set,undefined);
  assert.equal(result.$set_once,undefined);
  assert.ok(!JSON.stringify(result).includes('private'));
  assert.equal(ctx.inits[0].before_send({uuid:'fixture',event:'$exception',properties:{message:'private'}}),null);
  ctx.service.track('private-event-name',{prompt:'private'});
  assert.equal(ctx.captures.length,1);
});
test('SDK failures never break a product action, and error classification never includes the raw message', async () => {
  const ctx=setup();
  await ctx.service.setEnabled(true);
  ctx.sdk.capture=()=>{throw new Error('network failure');};
  assert.doesNotThrow(()=>ctx.service.track('onboarding_completed'));
  assert.equal(ctx.classify(new Error('429 quota for private@example.com')),'rate_limit');
  assert.equal(ctx.classify(new Error('401 key=secret')),'authentication');
  assert.equal(ctx.classify(new Error('private page text')),'other');
});
