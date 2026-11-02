const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = ts.transpileModule(fs.readFileSync('src/services/agents/AgentOrchestrator.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
function setup(decide, act = async () => 'ok', pause = async () => {}, disk = {}) {
  const historyModule = { exports: {} };
  const historyCode = ts.transpileModule(fs.readFileSync('src/services/agents/AgentHistory.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  new Function('require', 'module', 'exports', historyCode)(require, historyModule, historyModule.exports);
  const actions = [];
  let observations = 0;
  class Planner { async initialize() {} decide(...args) { return decide(...args); } }
  class Browser {
    getTabId() { return 1; }
    constructor(_tabId, signal) { this.signal = signal; }
    async pause(ms) { return pause(ms, this.signal); }
    async observe() { return { url: 'https://example.com', elements: [], revision: `observation-${++observations}` }; }
    async act(step) { actions.push(step); return act(step); }
  }
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    if (name.includes('PlannerAgent')) return { PlannerAgent: Planner };
    if (name.includes('ObservedBrowser')) return { ObservedBrowser: Browser };
    if (name.includes('AgentHistory')) return historyModule.exports;
    throw new Error(`Unexpected import ${name}`);
  }, module, module.exports);
  global.chrome = { tabs: { query: async () => [{ id: 1, url: 'https://example.com' }], get: async () => ({ id: 1, windowId: 1, url: 'https://example.com' }) }, storage: { local: { get: async () => structuredClone(disk), set: async value => Object.assign(disk, structuredClone(value)) } } };
  return { agent: module.exports.AgentOrchestrator.getInstance(), actions, history: historyModule.exports.agentHistory, observations: () => observations, disk };
}
const recoverable = pending => ({ agentTaskHistoryV1: [{ id: 'saved', input: 'Original task', status: 'paused', startedAt: 1,
  steps: [{ id: 'old', type: 'click', description: 'Prior action', status: pending ? 'running' : 'completed' }], events: [],
  checkpoint: { version: 1, tabId: 99, windowId: 99, url: 'https://example.com', pending, uncertain: false } }] });
test('full runtime recovery is explicit and retains summaries without replaying completed actions', async () => {
  let decisions = 0;
  const ctx = setup(async (_input, _state, history) => {
    decisions++;
    assert.match(history[0].result, /Before restart: completed/);
    return { done: true, success: true, evidence: 'Current page confirms completion' };
  }, undefined, undefined, recoverable(false));
  await ctx.history.initialize();
  assert.equal(decisions, 0);
  assert.equal(ctx.history.getSnapshot().tasks[0].status, 'interrupted');
  const result = await ctx.agent.resumeSavedTask('saved');
  assert.equal(result.success, true);
  assert.equal(result.taskId, 'saved');
  assert.equal(ctx.actions.length, 0);
  assert.equal(ctx.history.getSnapshot().tasks[0].steps.length, 1);
});
test('recovery cannot click again when the previous dispatch was still pending', async () => {
  const ctx = setup(async () => ({ done: false, action: { type: 'trustedClick', elementIndex: 0, description: 'Replay' } }), undefined, undefined, recoverable(true));
  const result = await ctx.agent.resumeSavedTask('saved');
  assert.equal(result.success, false);
  assert.match(result.error, /uncertain outcome/);
  assert.equal(ctx.actions.length, 0);
});
test('missing recovery tabs remain recoverable and reused tab IDs are not trusted', async () => {
  const ctx = setup(async () => ({ done: true, success: true, evidence: 'Matched page' }), undefined, undefined, recoverable(false));
  chrome.tabs.query = async () => [{ id: 99, url: 'https://unrelated.com' }];
  assert.equal((await ctx.agent.resumeSavedTask('saved')).success, false);
  assert.equal(ctx.history.getSnapshot().tasks[0].status, 'interrupted');
  chrome.tabs.query = async () => [{ id: 1, url: 'https://example.com' }];
  assert.equal((await ctx.agent.resumeSavedTask('saved')).success, true);
});
test('write-ahead checkpoint is durable before dispatch and cleared only afterwards', async () => {
  let calls = 0;
  const ctx = setup(async () => ++calls === 1 ? { done: false, action: { type: 'click', description: 'Click once' } }
    : { done: true, success: true, evidence: 'Observed' }, async () => {
      assert.equal(ctx.disk.agentTaskHistoryV1[0].checkpoint.pending, true);
      assert.equal(ctx.disk.agentTaskHistoryV1[0].steps[0].status, 'running');
      return 'Clicked';
    });
  assert.equal((await ctx.agent.executeTask('Click once')).success, true);
  assert.equal(ctx.disk.agentTaskHistoryV1[0].checkpoint.pending, false);
});
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
test('provider rate limits show a clear status and do not replay browser actions', async () => {
  const { agent, actions } = setup(async () => {
    const error = new Error('Rate limit exceeded');
    error.type = 'rate_limit_error';
    throw error;
  });
  const progress = [];
  const result = await agent.executeTask('play a song', { onProgress: message => progress.push(message) });
  assert.equal(result.success, false);
  assert.match(result.error, /provider rate limit persists/i);
  assert.equal(progress.filter(message => /Provider cooldown/.test(message)).length, 2);
  assert.equal(actions.length, 0);
  assert.equal(agent.isTaskExecuting(), false);
});
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
test('a temporary provider cooldown recovers from a fresh observation', async () => {
  let calls = 0;
  const ctx = setup(async () => {
    if (++calls === 1) throw new Error('429 retry in 1s');
    return { done: true, success: true, evidence: 'Fresh destination verified' };
  });
  assert.equal((await ctx.agent.executeTask('inspect')).success, true);
  assert.equal(ctx.observations(), 2);
  assert.equal(ctx.actions.length, 0);
});
test('Stop aborts a provider cooldown without another request or browser action', async () => {
  const entered = deferred();
  let calls = 0;
  const ctx = setup(async () => { calls++; throw new Error('429 retry in 60s'); }, undefined,
    async (_ms, signal) => { entered.resolve(); await new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('Stopped')), { once: true })); });
  const running = ctx.agent.executeTask('inspect');
  await entered.promise;
  await ctx.agent.stopCurrentTask();
  assert.equal((await running).success, false);
  assert.equal(calls, 1);
  assert.equal(ctx.actions.length, 0);
});
test('Pause during a cooldown gates provider retry until Resume', async () => {
  const entered = deferred(), release = deferred();
  let calls = 0;
  const ctx = setup(async () => {
    if (++calls === 1) throw new Error('429 retry in 1s');
    return { done: true, success: true, evidence: 'Observed' };
  }, undefined, async () => { entered.resolve(); await release.promise; });
  const running = ctx.agent.executeTask('inspect');
  await entered.promise;
  await ctx.agent.pauseCurrentTask();
  release.resolve();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  await ctx.agent.resumeCurrentTask();
  assert.equal((await running).success, true);
  assert.equal(calls, 2);
});
test('an uncertain submission is never automatically clicked again', async () => {
  const ctx = setup(async () => ({ done: false, action: { type: 'click', description: 'Submit', elementIndex: 0 } }),
    async () => ({ submission: 'unverified' }));
  const result = await ctx.agent.executeTask('submit form');
  assert.equal(result.success, false);
  assert.match(result.error, /uncertain outcome/);
  assert.equal(ctx.actions.length, 1);
});
test('pause interrupts planning; resume observes again and retains the original task', async () => {
  const entered = deferred();
  const revisions = [];
  let calls = 0;
  const ctx = setup(async (_task, state, _history, signal) => {
    revisions.push(state.revision);
    if (++calls === 1) {
      entered.resolve();
      return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('planning aborted')), { once: true }));
    }
    if (calls === 2) return { done: false, action: { type: 'wait', description: 'Continue from fresh state' } };
    return { done: true, success: true, evidence: 'Verified after resume' };
  });
  const running = ctx.agent.executeTask('Continue this task');
  await entered.promise;
  await ctx.agent.pauseCurrentTask();
  assert.equal(ctx.history.getSnapshot().tasks[0].status, 'paused');
  assert.equal(ctx.actions.length, 0);
  assert.equal(ctx.observations(), 1);
  await assert.rejects(ctx.agent.executeTask('duplicate'), /paused/);
  await ctx.agent.resumeCurrentTask();
  assert.equal((await running).success, true);
  assert.deepEqual(revisions, ['observation-1', 'observation-2', 'observation-3']);
  assert.equal(ctx.actions.length, 1);
  assert.equal(ctx.history.getSnapshot().tasks.length, 1);
  assert.equal(ctx.history.getSnapshot().tasks[0].status, 'completed');
});
test('an action in flight finishes while paused and is not replayed on resume', async () => {
  const entered = deferred(), release = deferred(), completed = deferred();
  let calls = 0;
  const ctx = setup(async () => ++calls === 1
    ? { done: false, action: { type: 'click', description: 'Click once' } }
    : { done: true, success: true, evidence: 'Observed completed action' },
  async () => { entered.resolve(); await release.promise; return 'Clicked'; });
  const running = ctx.agent.executeTask('Click once', { onStepComplete: () => completed.resolve() });
  await entered.promise;
  await ctx.agent.pauseCurrentTask();
  release.resolve();
  await completed.promise;
  assert.equal(calls, 1);
  assert.equal(ctx.history.getSnapshot().tasks[0].status, 'paused');
  assert.equal(ctx.history.getSnapshot().tasks[0].steps[0].status, 'completed');
  await ctx.agent.resumeCurrentTask();
  assert.equal((await running).success, true);
  assert.equal(ctx.actions.length, 1);
});
test('Stop cancels a paused run and releases the lock for a new task', async () => {
  const entered = deferred();
  let calls = 0;
  const ctx = setup(async (_task, _state, _history, signal) => {
    if (++calls === 1) { entered.resolve(); return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })); }
    return { done: true, success: true, evidence: 'New task completed' };
  });
  const running = ctx.agent.executeTask('Old');
  await entered.promise;
  await ctx.agent.pauseCurrentTask();
  await ctx.agent.stopCurrentTask();
  assert.equal((await running).success, false);
  assert.equal(ctx.history.getSnapshot().tasks[0].status, 'cancelled');
  assert.equal((await ctx.agent.executeTask('New')).success, true);
  assert.equal(ctx.actions.length, 0);
});
test('a late planner result after Resume is discarded rather than acting on an old observation', async () => {
  const entered = deferred(), late = deferred();
  let calls = 0;
  const ctx = setup(async () => {
    if (++calls === 1) { entered.resolve(); return late.promise; }
    return { done: true, success: true, evidence: 'Fresh state already satisfies task' };
  });
  const running = ctx.agent.executeTask('Inspect page');
  await entered.promise;
  await ctx.agent.pauseCurrentTask();
  await ctx.agent.resumeCurrentTask();
  late.resolve({ done: false, action: { type: 'click', description: 'Stale click' } });
  assert.equal((await running).success, true);
  assert.equal(ctx.actions.length, 0);
  assert.equal(ctx.observations(), 2);
});
