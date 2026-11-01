const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('src/services/agents/AgentOrchestrator.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
function setup(decide) {
  const actions = [];
  class Planner { async initialize() {} decide(...args) { return decide(...args); } }
  class Browser {
    async observe() { return { url: 'https://example.com', elements: [], revision: 'test' }; }
    async act(step) { actions.push(step); return 'ok'; }
  }
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name.includes('PlannerAgent')) return { PlannerAgent: Planner };
    if (name.includes('ObservedBrowser')) return { ObservedBrowser: Browser };
    throw new Error(`Unexpected import ${name}`);
  }, module, module.exports);
  global.chrome = { tabs: { query: async () => [{ id: 1 }] } };
  return { agent: module.exports.AgentOrchestrator.getInstance(), actions };
}
test('stop during planning rejects a late action and does not lock the next run', async () => {
  let release, entered;
  const planning = new Promise(resolve => { entered = resolve; });
  const late = new Promise(resolve => { release = resolve; });
  let calls = 0;
  const { agent, actions } = setup(async () => {
    if (++calls === 1) { entered(); return late; }
    return { done: true, success: true, evidence: 'Current destination observed' };
  });
  let completions = 0;
  const old = agent.executeTask('navigate', { onStepComplete: () => completions++ });
  await planning;
  await agent.stopCurrentTask();
  const next = await agent.executeTask('new task');
  assert.equal(next.success, true);
  release({ done: false, action: { type: 'navigate', description: 'late action', url: 'https://example.com' } });
  assert.equal((await old).success, false);
  assert.equal(actions.length, 0);
  assert.equal(completions, 0);
  assert.equal(agent.isTaskExecuting(), false);
});
test('repeated identical actions fail rather than falsely report task success', async () => {
  const { agent, actions } = setup(async () => ({ done: false, action: { type: 'wait', description: 'wait' } }));
  const result = await agent.executeTask('complete something');
  assert.equal(result.success, false);
  assert.match(result.error, /no observable progress/);
  assert.equal(actions.length, 2);
});
