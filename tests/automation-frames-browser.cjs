const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ObservedBrowser } = require('./load-typescript.cjs')('src/services/automation/ObservedBrowser.ts');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      let body;
      if (url.hostname === 'main.frames.test' && url.pathname === '/') body = '<input aria-label="Main field"><iframe src="/same"></iframe><iframe src="https://cross.frames.test/form"></iframe>';
      else if (url.pathname === '/same') body = '<input aria-label="Same origin field">';
      else if (url.pathname === '/form') body = '<input aria-label="Cross origin field"><button onclick="document.querySelector(\'output\').textContent=document.querySelector(\'input\').value">Save</button><output></output><iframe src="https://nested.frames.test/inner"></iframe>';
      else body = '<input aria-label="Nested field"><button onclick="if(event.isTrusted)this.dataset.clicked=\'yes\'">Native nested</button><div role="switch" tabindex="0" aria-checked="false" onclick="if(event.isTrusted)this.setAttribute(\'aria-checked\',this.getAttribute(\'aria-checked\')===\'true\'?\'false\':\'true\')">Custom switch</div>';
      return route.fulfill({ contentType: 'text/html', body });
    });
    const page = await context.newPage();
    await page.goto('https://main.frames.test/');
    assert.equal(await page.evaluate(() => document.querySelectorAll('iframe')[1].contentDocument === null), true);
    const ids = new Map(), generations = new Map();
    const id = frame => { if (!ids.has(frame)) { ids.set(frame, ids.size); generations.set(frame, 0); } return ids.get(frame); };
    page.frames().forEach(id);
    page.on('framenavigated', frame => { if (ids.has(frame)) generations.set(frame, generations.get(frame) + 1); });
    const documentId = frame => `doc-${id(frame)}-${generations.get(frame)}`;
    const script = fs.readFileSync('public/automation-runtime.js', 'utf8');
    const cdp = await context.newCDPSession(page);
    global.chrome = {
      debugger: { attach: async () => {}, detach: async () => {}, sendCommand: async (_target, method, params) => cdp.send(method, params) },
      tabs: { get: async () => ({ windowId: 1, status: 'complete' }), query: async () => [{ id: 1, windowId: 1, url: page.url(), active: true }], onCreated: { addListener() {}, removeListener() {} } },
      scripting: { executeScript: async ({ target, files, func, args = [] }) => {
        const targets = page.frames().filter(frame => target.allFrames || (target.documentIds ? target.documentIds.includes(documentId(frame)) : (target.frameIds || [0]).includes(id(frame))));
        if (!targets.length) throw new Error('Document removed');
        return Promise.all(targets.map(async frame => ({ frameId: id(frame), documentId: documentId(frame),
          result: files ? await frame.evaluate(script) : await frame.evaluate(`(${func.toString()})(...${JSON.stringify(args)})`) })));
      } }
    };
    const adapter = new ObservedBrowser(1, new AbortController().signal);
    adapter.pause = async () => {};
    let state = await adapter.observe();
    assert.equal(state.frames.length, 4);
    assert.equal(new Set(state.elements.map(el => el.index)).size, state.elements.length);
    for (const label of ['Same origin field', 'Cross origin field', 'Nested field']) {
      state = await adapter.observe();
      const input = state.elements.find(el => el.label === label);
      await adapter.act({ type: 'fill', elementIndex: input.index, data: label }, state);
    }
    state = await adapter.observe();
    const save = state.elements.find(el => el.text === 'Save');
    await adapter.act({ type: 'click', elementIndex: save.index }, state);
    const child = page.frames().find(frame => frame.url().includes('cross.frames.test'));
    assert.equal(await child.locator('output').textContent(), 'Cross origin field');
    assert.equal(await page.locator('input').inputValue(), '');
    state = await adapter.observe();
    const nested = page.frames().find(frame => frame.url().includes('nested.frames.test'));
    await adapter.act({ type: 'trustedClick', elementIndex: state.elements.find(el => el.text === 'Native nested').index }, state);
    assert.equal(await nested.locator('button').getAttribute('data-clicked'), 'yes');
    state = await adapter.observe();
    await adapter.act({ type: 'trustedClick', elementIndex: state.elements.find(el => el.role === 'switch').index }, state);
    state = await adapter.observe();
    assert.equal((await adapter.act({ type: 'verify', data: { kind: 'control', elementIndex: state.elements.find(el => el.role === 'switch').index, property: 'checked', value: true } }, state)).verified, true);
    await page.evaluate(() => {
      const r = document.querySelectorAll('iframe')[1].getBoundingClientRect();
      const overlay = document.createElement('div'); overlay.id = 'overlay';
      Object.assign(overlay.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', zIndex: '99999' });
      document.body.appendChild(overlay);
    });
    state = await adapter.observe();
    await assert.rejects(adapter.act({ type: 'trustedClick', elementIndex: state.elements.find(el => el.text === 'Native nested').index }, state), /obscured/);
    await page.locator('#overlay').evaluate(el => el.remove());
    state = await adapter.observe();
    const stale = state.elements.find(el => el.label === 'Cross origin field');
    await child.goto('https://cross.frames.test/replaced');
    await assert.rejects(adapter.act({ type: 'fill', elementIndex: stale.index, data: 'wrong document' }, state), /Document removed/);
    console.log('PASS: real Chromium nested cross-origin native clicks, custom switch verification, ancestor overlay rejection, frame routing and stale-document rejection (extension APIs adapted).');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
