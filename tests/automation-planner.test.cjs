const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/services/agents/PlannerAgent.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
async function decide(response, state = {}, inspect = () => {}) {
  const provider = { isConfigured: () => true, generateResponse: async function* (prompt, options) { inspect(prompt, options); yield JSON.stringify(response); } };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => name === 'zod' ? require('zod') : {
    AIService: { getInstance: () => ({ getCurrentProvider: () => provider }) }
  }, module, module.exports);
  return new module.exports.PlannerAgent().decide('Search cats', state, [], new AbortController().signal);
}
test('uses top-level description when fill action omits its own description', async () => {
  const result = await decide({ description: 'Fill Google search box with cats', done: false,
    action: { type: 'fill', elementIndex: 5, data: 'cats' } });
  assert.equal(result.action.description, 'Fill Google search box with cats');
  assert.equal(result.action.elementIndex, 5);
  assert.equal(result.action.data, 'cats');
});
test('retains an explicit nested description', async () => {
  const result = await decide({ description: 'Search cats', done: false,
    action: { type: 'click', elementIndex: 2, description: 'Click Search' } });
  assert.equal(result.action.description, 'Click Search');
});
test('still rejects unsupported action types and invalid indexes', async () => {
  await assert.rejects(decide({ description: 'Bad', done: false, action: { type: 'executeScript' } }));
  await assert.rejects(decide({ description: 'Bad', done: false, action: { type: 'click', elementIndex: -1 } }));
});
test('bounds page text while preserving every observed index and disables hidden retries', async () => {
  await decide({ description: 'Click', done: false, action: { type: 'click', elementIndex: 51 } },
    { text: 'x'.repeat(12000), elements: [{ index: 51, text: 'y'.repeat(500), label: 'Search' }], revision: 'internal' },
    (prompt, options) => {
      assert.ok(prompt.length < 5000);
      assert.match(prompt, /"index":51/);
      assert.ok(!prompt.includes('internal'));
      assert.equal(options.maxRetries, 0);
      assert.ok(options.abortSignal instanceof AbortSignal);
    });
});
