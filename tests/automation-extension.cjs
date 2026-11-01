const { chromium } = require('playwright-core');
const { mkdtemp } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
(async () => {
  const server = http.createServer((_, res) => res.end('<input aria-label="Search songs"><button onclick="document.querySelector(\'output\').textContent=document.querySelector(\'input\').value">Search</button><output></output>'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let context;
  try {
    const profile = await mkdtemp(path.join(tmpdir(), 'delight-automation-test-'));
    const extension = path.resolve('dist');
    context = await chromium.launchPersistentContext(profile, {
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
    });
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker', { timeout: 15000 });
    const id = new URL(worker.url()).host;
    const page = await context.newPage();
    await page.goto(`chrome-extension://${id}/src/pages/accuracy/index.html`);
    const fixture = await context.newPage();
    await fixture.goto(`http://127.0.0.1:${server.address().port}`);
    const result = await page.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const tab = tabs.find(t => t.url?.startsWith('http://127.0.0.1:'));
      const target = { tabId: tab.id };
      await chrome.scripting.executeScript({ target, files: ['automation-runtime.js'] });
      const observe = async () => JSON.parse((await chrome.scripting.executeScript({ target,
        func: () => JSON.stringify(globalThis.delightAutomation.observe()) }))[0].result);
      const first = await observe();
      const input = first.elements.find(e => e.label === 'Search songs');
      await chrome.scripting.executeScript({ target, func: (index, revision) => globalThis.delightAutomation.act({ type: 'fill', elementIndex: index, data: 'cats' }, revision), args: [input.index, first.revision] });
      const second = await observe();
      const button = second.elements.find(e => e.text === 'Search');
      await chrome.scripting.executeScript({ target, func: (index, revision) => globalThis.delightAutomation.act({ type: 'click', elementIndex: index }, revision), args: [button.index, second.revision] });
      return { count: first.elementCount, text: (await observe()).text };
    });
    assert.equal(result.count, 2);
    assert.match(result.text, /cats/);
    console.log('PASS: real Chrome extension injection, observation, fill, click, and re-observation');
  } finally {
    await context?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
