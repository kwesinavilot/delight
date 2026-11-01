const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const source = fs.readFileSync('public/automation-runtime.js', 'utf8');
function setup(html) {
  const dom = new JSDOM(html, { url: 'https://example.com', runScripts: 'outside-only' });
  const w = dom.window;
  w.HTMLElement.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, right: 100, bottom: 30, width: 100, height: 30 });
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.eval(source);
  return { dom, w, runtime: w.delightAutomation };
}
test('observes open shadow roots and fills controlled inputs once', () => {
  const { dom, w, runtime } = setup('<div id="host"></div>');
  const root = w.document.querySelector('#host').attachShadow({ mode: 'open' });
  root.innerHTML = '<input aria-label="Search songs">';
  const input = root.querySelector('input');
  let changes = 0;
  input.addEventListener('input', () => changes++);
  const state = runtime.observe();
  assert.equal(state.elements[0].label, 'Search songs');
  runtime.act({ type: 'fill', elementIndex: 0, data: 'cats' }, state.revision);
  assert.equal(input.value, 'cats');
  assert.equal(changes, 1);
  dom.window.close();
});
test('rejects stale snapshots and disconnected targets', () => {
  const { dom, w, runtime } = setup('<button>Music</button>');
  const old = runtime.observe();
  const state = runtime.observe();
  assert.throws(() => runtime.act({ type: 'click', elementIndex: 0 }, old.revision), /Stale/);
  w.document.querySelector('button').remove();
  assert.throws(() => runtime.act({ type: 'click', elementIndex: 0 }, state.revision), /detached/);
  dom.window.close();
});
test('clicks once and rejects obscured targets', () => {
  const { dom, w, runtime } = setup('<button>Music</button><div id="overlay"></div>');
  const button = w.document.querySelector('button');
  let clicks = 0;
  button.onclick = () => clicks++;
  w.document.elementFromPoint = () => button;
  const state = runtime.observe();
  runtime.act({ type: 'click', elementIndex: 0 }, state.revision);
  assert.equal(clicks, 1);
  w.document.elementFromPoint = () => w.document.querySelector('#overlay');
  assert.throws(() => runtime.act({ type: 'click', elementIndex: 0 }, state.revision), /obscured/);
  dom.window.close();
});
