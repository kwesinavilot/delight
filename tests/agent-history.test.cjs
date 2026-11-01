const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/services/agents/AgentHistory.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
new Function('require', 'module', 'exports', code)(require, moduleUnderTest, moduleUnderTest.exports);
const { AgentHistory } = moduleUnderTest.exports;
function setup(data = {}) {
  const disk = structuredClone(data);
  global.chrome = { storage: { local: {
    get: async () => structuredClone(disk),
    set: async value => { await Promise.resolve(); Object.assign(disk, structuredClone(value)); }
  } } };
  return { store: new AgentHistory(), disk };
}
test('retains actions, errors and final evidence after recreating the history store', async () => {
  const { store, disk } = setup();
  await store.start('one', 'Search cats');
  store.steps('one', [{ id: 's', type: 'fill', description: 'Fill search', data: 'private typed value', status: 'completed' }]);
  store.event('one', 'Recovered from overlay', 'error');
  await store.finish('one', 'completed', 'Search results observed');
  const restored = new AgentHistory();
  await restored.initialize();
  const task = restored.getSnapshot().tasks[0];
  assert.equal(task.status, 'completed');
  assert.equal(task.result, 'Search results observed');
  assert.equal(task.events[0].kind, 'error');
  assert.equal(task.steps[0].status, 'completed');
  assert.ok(!JSON.stringify(disk).includes('private typed value'));
});
test('cancelled tasks stay cancelled when late results arrive', async () => {
  const { store } = setup();
  await store.start('old', 'Old task');
  await store.finish('old', 'cancelled', 'Cancelled');
  await store.start('new', 'New task');
  store.event('old', 'Late completion', 'success');
  await store.finish('old', 'completed', 'Wrong result');
  assert.equal(store.getSnapshot().tasks[0].status, 'running');
  assert.equal(store.getSnapshot().tasks[1].status, 'cancelled');
  assert.equal(store.getSnapshot().tasks[1].result, 'Cancelled');
});
test('closed or reloaded runs restore as interrupted rather than holding a stale running lock', async () => {
  const { store } = setup();
  await store.start('one', 'Navigate');
  store.steps('one', [{ id: 's', type: 'navigate', description: 'Navigate', status: 'running' }]);
  await store.flush();
  const restored = new AgentHistory();
  await restored.initialize();
  assert.equal(restored.getSnapshot().tasks[0].status, 'interrupted');
  assert.equal(restored.getSnapshot().tasks[0].steps[0].status, 'failed');
});
test('bounds retained history and clearing preserves the active task', async () => {
  const { store, disk } = setup();
  for (let i = 0; i < 22; i++) {
    await store.start(String(i), 'Task');
    await store.finish(String(i), 'completed', 'Done');
  }
  assert.equal(store.getSnapshot().tasks.length, 20);
  await store.start('active', 'Active');
  await store.clear();
  assert.deepEqual(store.getSnapshot().tasks.map(t => t.id), ['active']);
  assert.equal(disk.agentTaskHistoryV1.length, 1);
});
test('storage failures surface a warning and retain the session history', async () => {
  const { store } = setup();
  await store.initialize();
  chrome.storage.local.set = async () => { throw new Error('quota'); };
  await store.start('one', 'Task');
  await store.finish('one', 'failed', 'Failed');
  assert.equal(store.getSnapshot().tasks[0].status, 'failed');
  assert.match(store.getSnapshot().storageError, /could not be saved/);
});
