const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/services/automation/ObservedBrowser.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const moduleUnderTest = { exports: {} };
new Function('require', 'module', 'exports', code)(name => name === './FrameObservation' ? require('./load-typescript.cjs')('src/services/automation/FrameObservation.ts') : require(name), moduleUnderTest, moduleUnderTest.exports);
const { ObservedBrowser } = moduleUnderTest.exports;
const before = { url: 'https://example.com/results', elements: [{ index: 1, href: '/watch' }] };
function setup(states, controller = new AbortController()) {
  global.chrome = { tabs: { get: async () => ({ status: 'complete', windowId: 1 }), query: async () => [], onCreated: { addListener() {}, removeListener() {} } },
    scripting: { executeScript: async () => [{ result: null }] } };
  const browser = new ObservedBrowser(1, controller.signal);
  let reads = 0;
  browser.pause = async () => controller.signal.throwIfAborted();
  browser.observe = async () => states[Math.min(reads++, states.length - 1)];
  return { browser, reads: () => reads };
}
test('null click result waits for verified playback', async () => {
  const { browser, reads } = setup([
    { ...before, media: [] },
    { url: 'https://example.com/watch', media: [{ paused: false, ended: false, readyState: 3 }] }
  ]);
  const result = await browser.act({ type: 'click', elementIndex: 1 }, before);
  assert.equal(result.playing, true);
  assert.equal(reads(), 2);
});
test('a link that does nothing is reported as unverified after bounded waiting', async () => {
  const { browser, reads } = setup([{ ...before, media: [] }]);
  const result = await browser.act({ type: 'click', elementIndex: 1 }, before);
  assert.match(result.outcome, /No navigation or playback verified/);
  assert.equal(reads(), 16);
});
test('Stop interrupts post-click waiting', async () => {
  const controller = new AbortController();
  const { browser } = setup([before], controller);
  browser.pause = async () => { controller.abort(); controller.signal.throwIfAborted(); };
  await assert.rejects(browser.act({ type: 'click', elementIndex: 1 }, before));
});
test('new frame snapshot revisions do not prevent a settled page from being detected', async () => {
  const { browser } = setup([]);
  let reads = 0;
  browser.observe = async () => ({ url: before.url, text: 'Settled', elements: [{ index: 1, frameId: 2, frameRevision: String(++reads), label: 'Done' }], media: [] });
  const result = await browser.act({ type: 'click', elementIndex: 1 }, { ...before, elements: [{ index: 1 }] });
  assert.equal(result.outcome, 'Page settled after click');
  assert.equal(reads, 3);
});
