const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => dependencies[name] || require(name), module, module.exports);
  return module.exports;
}
function storage(localValue, syncValue, failWrite = false) {
  const local = localValue ? { aiSettings: structuredClone(localValue) } : {};
  const sync = syncValue ? { aiSettings: structuredClone(syncValue) } : {};
  const calls = [];
  global.chrome = { storage: {
    local: { get: async () => structuredClone(local), set: async value => { calls.push('local-write'); if (failWrite) throw new Error('write failed'); Object.assign(local, structuredClone(value)); }, remove: async keys => keys.forEach(key => delete local[key]) },
    sync: { get: async () => structuredClone(sync), remove: async keys => { calls.push('sync-remove'); keys.forEach(key => delete sync[key]); } }
  } };
  return { local, sync, calls };
}
const config = key => ({ ai: { currentProvider: 'groq', providers: { groq: { apiKey: key, model: 'openai/gpt-oss-20b', maxTokens: 1000, temperature: 0.7 } } } });
test('migrates existing keys locally before removing the synced copy', async () => {
  const data = storage(null, config('test-key'));
  const manager = load('src/services/config/ConfigManager.ts').ConfigManager.getInstance();
  await manager.initialize();
  assert.equal(data.local.aiSettings.ai.providers.groq.apiKey, 'test-key');
  assert.equal(data.sync.aiSettings, undefined);
  assert.deepEqual(data.calls, ['local-write', 'sync-remove']);
  await manager.updateProviderConfig('groq', { apiKey: ' new-key ' });
  assert.equal(data.local.aiSettings.ai.providers.groq.apiKey, 'new-key');
  assert.ok(!(await manager.exportSettings()).includes('new-key'));
});
test('failed migration preserves the synced credentials', async () => {
  const data = storage(null, config('test-key'), true);
  const manager = load('src/services/config/ConfigManager.ts').ConfigManager.getInstance();
  await assert.rejects(manager.initialize(), /Could not load local/);
  assert.equal(data.sync.aiSettings.ai.providers.groq.apiKey, 'test-key');
});
test('local settings win over stale synced settings', async () => {
  const data = storage(config('local-key'), config('stale-key'));
  const manager = load('src/services/config/ConfigManager.ts').ConfigManager.getInstance();
  await manager.initialize();
  assert.equal((await manager.getProviderConfig('groq')).apiKey, 'local-key');
  assert.deepEqual(data.calls, ['sync-remove']);
});
test('Gemini model loading uses authentication headers and returns generation models only', async () => {
  const original = global.fetch;
  try {
    global.fetch = async (url, options) => {
      assert.ok(!url.includes('test-key'));
      assert.equal(options.headers['x-goog-api-key'], 'test-key');
      return { ok: true, json: async () => ({ models: [
        { name: 'models/gemini-example', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/embedding', supportedGenerationMethods: ['embedContent'] }
      ] }) };
    };
    const setup = load('src/services/config/ProviderSetup.ts', { '../ai/AIService': {} });
    assert.deepEqual(await setup.listGeminiModels(' test-key '), ['gemini-example']);
  } finally { global.fetch = original; }
});
test('connection tests distinguish quota from invalid keys without leaking credentials', async () => {
  const service = { testProviderConnection: async () => { const error = new Error('429 test-secret-key'); error.type = 'rate_limit_error'; throw error; } };
  const setup = load('src/services/config/ProviderSetup.ts', { '../ai/AIService': { AIService: { getInstance: () => service } } });
  await assert.rejects(setup.testProviderConfiguration({ provider: 'gemini', apiKey: 'test-secret-key', model: 'gemini-example' }), error => /does not mean the key is invalid/.test(error.message) && !error.message.includes('test-secret-key'));
});
