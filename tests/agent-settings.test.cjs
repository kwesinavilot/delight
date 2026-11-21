const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadAgentSettings, saveAgentSettings } = require('./load-typescript.cjs')('src/services/config/AgentSettings.ts');
test('agent settings default to 50 turns and stay in local storage', async () => {
  const disk = {};
  global.chrome = { storage: { local: { get: async () => disk, set: async value => Object.assign(disk, value) } } };
  assert.deepEqual(await loadAgentSettings(), { maximumTurns: 50, customInstructions: '' });
  await saveAgentSettings({ maximumTurns: 12, customInstructions: 'My company is Acme GmbH. Answer briefly.' });
  assert.equal((await loadAgentSettings()).maximumTurns, 12);
  assert.match((await loadAgentSettings()).customInstructions, /Acme/);
  await assert.rejects(saveAgentSettings({ maximumTurns: 0, customInstructions: '' }), /positive whole number/);
  await assert.rejects(saveAgentSettings({ maximumTurns: 1.5, customInstructions: '' }), /positive whole number/);
  await assert.rejects(saveAgentSettings({ maximumTurns: 50, customInstructions: 'x'.repeat(1501) }), /1,500/);
  disk.agentSettings = { maximumTurns: -2, customInstructions: 'x'.repeat(1600) };
  assert.equal((await loadAgentSettings()).maximumTurns, 50);
  assert.equal((await loadAgentSettings()).customInstructions.length, 1500);
});
