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
function setup() {
  const tabs = new Map([
    [1, { id: 1, windowId: 10, status: 'complete', url: 'https://example.com/', title: 'Source', active: true }],
    [2, { id: 2, windowId: 10, status: 'complete', url: 'https://other.test/', title: 'Other', active: false }],
    [3, { id: 3, windowId: 20, status: 'complete', url: 'https://private.test/', title: 'Other window' }]
  ]);
  const listeners = new Set(), updates = [], injections = [];
  let click = () => {};
  const controller = new AbortController();
  const create = async properties => {
    const tab = { id: tabs.size + 10, status: 'complete', ...properties };
    tabs.set(tab.id, tab);
    listeners.forEach(listener => listener(tab));
    return tab;
  };
  global.chrome = {
    tabs: {
      get: async id => { if (!tabs.has(id)) throw new Error('Tab closed'); return tabs.get(id); },
      query: async ({ windowId }) => [...tabs.values()].filter(tab => tab.windowId === windowId),
      create,
      update: async (id, properties) => { updates.push(id); Object.assign(tabs.get(id), properties); return tabs.get(id); },
      onCreated: { addListener: listener => listeners.add(listener), removeListener: listener => listeners.delete(listener) }
    },
    scripting: { executeScript: async ({ target, files, args }) => {
      injections.push(target.tabId);
      if (files) return [{}];
      if (args?.[0]?.type === 'click') { await click(); return [{ result: null }]; }
      return [{ result: JSON.stringify({ revision: 'r', url: tabs.get(target.tabId).url, title: 'Page', elements: [{ index: 0, href: '/child', target: '_blank' }], media: [] }) }];
    } }
  };
  const browser = new ObservedBrowser(1, controller.signal);
  browser.pause = async () => controller.signal.throwIfAborted();
  return { browser, tabs, listeners, updates, injections, create, controller, onClick: fn => { click = fn; } };
}
test('observations include only the task window and switch observations to the chosen tab', async () => {
  const { browser, injections } = setup();
  const state = await browser.observe();
  assert.deepEqual(state.tabs.map(tab => tab.id), [1, 2]);
  await browser.act({ type: 'switchTab', tabId: 2 }, state);
  assert.equal((await browser.observe()).tabId, 2);
  assert.equal(injections.at(-1), 2);
});
test('opens a new tab in the task window and rejects unsafe navigation URLs', async () => {
  const { browser, tabs } = setup();
  const state = await browser.observe();
  const result = await browser.act({ type: 'newTab', url: 'https://new.test/' }, state);
  assert.equal(tabs.get(result.tabId).windowId, 10);
  assert.equal((await browser.observe()).tabId, result.tabId);
  await assert.rejects(browser.act({ type: 'newTab', url: 'javascript:alert(1)' }, state), /HTTP/);
});
test('rejects guessed, closed, or cross-window switch targets', async () => {
  const { browser, tabs } = setup();
  const state = await browser.observe();
  await assert.rejects(browser.act({ type: 'switchTab', tabId: 42 }, state), /listed/);
  await assert.rejects(browser.act({ type: 'switchTab', tabId: 3 }, { ...state, tabs: [...state.tabs, { id: 3 }] }), /another window/);
  tabs.delete(2);
  await assert.rejects(browser.act({ type: 'switchTab', tabId: 2 }, state), /closed/);
});
test('follows a popup associated with the clicked source and cleans the listener', async () => {
  const ctx = setup();
  const state = await ctx.browser.observe();
  let child;
  ctx.onClick(async () => { child = await ctx.create({ windowId: 10, openerTabId: 1, url: 'https://example.com/child' }); });
  const result = await ctx.browser.act({ type: 'click', elementIndex: 0 }, state);
  assert.equal(result.tabId, child.id);
  assert.equal((await ctx.browser.observe()).tabId, child.id);
  assert.equal(ctx.listeners.size, 0);
});
test('follows an exact target=_blank URL when noopener removes opener metadata', async () => {
  const ctx = setup();
  const state = await ctx.browser.observe();
  let child;
  ctx.onClick(async () => { child = await ctx.create({ windowId: 10, url: 'https://example.com/child' }); });
  const result = await ctx.browser.act({ type: 'click', elementIndex: 0 }, state);
  assert.equal(result.tabId, child.id);
});
test('ignores unrelated tabs created during a click', async () => {
  const ctx = setup();
  const state = await ctx.browser.observe();
  ctx.onClick(async () => {
    await ctx.create({ windowId: 20, openerTabId: 1, url: 'https://example.com/child' });
    await ctx.create({ windowId: 10, url: 'https://unrelated.test/' });
  });
  await ctx.browser.act({ type: 'click', elementIndex: 0 }, state);
  assert.deepEqual(ctx.updates, []);
  assert.equal((await ctx.browser.observe()).tabId, 1);
  assert.equal(ctx.listeners.size, 0);
});
test('Stop prevents following a newly created tab and removes the listener', async () => {
  const ctx = setup();
  const state = await ctx.browser.observe();
  ctx.onClick(async () => { await ctx.create({ windowId: 10, openerTabId: 1, url: 'https://example.com/child' }); ctx.controller.abort(); });
  await assert.rejects(ctx.browser.act({ type: 'click', elementIndex: 0 }, state));
  assert.deepEqual(ctx.updates, []);
  assert.equal(ctx.listeners.size, 0);
});
test('a closed controlled tab still exposes surviving tabs for recovery', async () => {
  const ctx = setup();
  await ctx.browser.observe();
  ctx.tabs.delete(1);
  const state = await ctx.browser.observe();
  assert.equal(state.closed, true);
  await ctx.browser.act({ type: 'switchTab', tabId: 2 }, state);
  assert.equal((await ctx.browser.observe()).tabId, 2);
});
