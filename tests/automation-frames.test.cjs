const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { combineFrameObservations } = load('src/services/automation/FrameObservation.ts');
const { ObservedBrowser } = load('src/services/automation/ObservedBrowser.ts');
const state = (label, url) => ({ revision: label, url, title: label, elements: [{ index: 0, label }], media: [], text: label });
const frames = () => [
  { frameId: 12, documentId: 'child-document', result: JSON.stringify(state('Child', 'https://child.test/form')) },
  { frameId: 0, documentId: 'main-document', result: JSON.stringify(state('Main', 'https://main.test/')) }
];
test('merges out-of-order frames into globally unique indexes and preserves routing', () => {
  const result = combineFrameObservations(frames());
  assert.deepEqual(result.elements.map(el => [el.index, el.frameId, el.frameIndex]), [[0, 0, 0], [1, 12, 0]]);
  assert.equal(result.url, 'https://main.test/');
  assert.equal(result.elements[1].frameRevision, 'Child');
  assert.equal(result.elements[1].documentId, 'child-document');
});
test('malformed child data produces a warning but invalid main data fails', () => {
  const result = combineFrameObservations([...frames(), { frameId: 99, result: 'invalid' }]);
  assert.equal(result.elements.length, 2);
  assert.match(result.frameWarnings[0], /99/);
  assert.throws(() => combineFrameObservations([frames()[0]]), /main-frame/);
});
test('routes a child fill to its document and local index, not the main frame', async () => {
  const calls = [];
  global.chrome = { scripting: { executeScript: async options => { calls.push(options); return [{ result: 'Filled' }]; } } };
  const browser = new ObservedBrowser(1, new AbortController().signal);
  browser.pause = async () => {};
  const observed = { ...combineFrameObservations(frames()), tabId: 1 };
  await browser.act({ type: 'fill', elementIndex: 1, data: 'cats' }, observed);
  assert.deepEqual(calls[0].target, { tabId: 1, documentIds: ['child-document'] });
  assert.equal(calls[0].args[0].elementIndex, 0);
  assert.equal(calls[0].args[1], 'Child');
  assert.equal(calls[0].args[2], 'https://child.test/form');
});
test('removed frames fail without retrying the action in the main frame', async () => {
  let calls = 0;
  global.chrome = { scripting: { executeScript: async () => { calls++; throw new Error('Document removed'); } } };
  const browser = new ObservedBrowser(1, new AbortController().signal);
  await assert.rejects(browser.act({ type: 'fill', elementIndex: 1, data: 'cats' }, combineFrameObservations(frames())), /removed/);
  assert.equal(calls, 1);
});
test('inaccessible all-frame injection falls back to an explicitly partial main observation', async () => {
  global.chrome = {
    tabs: { get: async () => ({ windowId: 10 }), query: async () => [{ id: 1, url: 'https://main.test/' }] },
    scripting: { executeScript: async options => {
      if (options.target.allFrames) throw new Error('Frame inaccessible');
      return options.files ? [{}] : [frames()[1]];
    } }
  };
  const observed = await new ObservedBrowser(1, new AbortController().signal).observe();
  assert.equal(observed.elements.length, 1);
  assert.match(observed.frameWarnings[0], /could not be accessed/);
});
test('scroll targets must belong to an observed frame', async () => {
  let target;
  global.chrome = { scripting: { executeScript: async options => { target = options.target; return [{}]; } } };
  const browser = new ObservedBrowser(1, new AbortController().signal);
  const observed = combineFrameObservations(frames());
  await browser.act({ type: 'scrollToPercent', data: { percent: 50, frameId: 12 } }, observed);
  assert.deepEqual(target.frameIds, [12]);
  await assert.rejects(browser.act({ type: 'scrollToPercent', data: { percent: 50, frameId: 999 } }, observed), /listed/);
});
