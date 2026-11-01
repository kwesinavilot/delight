const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { trustedInput } = require('./load-typescript.cjs')('src/services/automation/TrustedInput.ts');
const { ObservedBrowser } = require('./load-typescript.cjs')('src/services/automation/ObservedBrowser.ts');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<form><input required aria-label="Query"><button>Submit</button></form><button id="native">Native only</button><div role="status"></div>');
    await page.evaluate(() => {
      window.submissions = 0; window.nativeClicks = 0;
      document.querySelector('form').onsubmit = event => { event.preventDefault(); window.submissions++; document.querySelector('[role=status]').textContent = 'Saved successfully'; };
      document.querySelector('#native').onclick = event => { if (event.isTrusted) window.nativeClicks++; };
    });
    await page.evaluate(fs.readFileSync('public/automation-runtime.js', 'utf8'));
    const session = await page.context().newCDPSession(page);
    let attachments = 0, detachments = 0;
    global.chrome = { debugger: {
      attach: async () => { attachments++; }, detach: async () => { detachments++; },
      sendCommand: async (_target, method, params) => session.send(method, params)
    } };
    const signal = new AbortController().signal;
    const prepare = async (index, pointer = false) => page.evaluate(({ index, pointer }) => {
      const state = delightAutomation.observe();
      return delightAutomation.prepare(index, state.revision, pointer);
    }, { index, pointer });
    await prepare(0);
    await trustedInput(1, signal, { keys: 'Enter' });
    assert.equal(await page.evaluate(() => window.submissions), 0, 'required validation blocks submission');
    await page.locator('input').fill('old query');
    await prepare(0);
    await trustedInput(1, signal, { keys: 'Ctrl+A' });
    await trustedInput(1, signal, { keys: 'x' });
    assert.equal(await page.locator('input').inputValue(), 'x');
    await trustedInput(1, signal, { keys: 'Enter' });
    assert.equal(await page.evaluate(() => window.submissions), 1);
    await page.evaluate(() => document.querySelector('#native').click());
    assert.equal(await page.evaluate(() => window.nativeClicks), 0);
    await trustedInput(1, signal, await prepare(2, true));
    assert.equal(await page.evaluate(() => window.nativeClicks), 1);
    assert.equal(attachments, detachments);
    await assert.rejects(trustedInput(1, signal, { keys: 'InvalidKey' }), /Unsupported/);
    await assert.rejects(trustedInput(1, signal, { keys: 'Ctrl+W' }), /outside supported/);
    assert.equal(attachments, detachments);
    chrome.tabs = { get: async () => ({ id: 1, windowId: 1, status: 'complete' }), query: async () => [], onCreated: { addListener() {}, removeListener() {} } };
    chrome.scripting = { executeScript: async ({ func, args }) => [{ result: await page.evaluate(`(${func.toString()})(...${JSON.stringify(args)})`) }] };
    const observed = new ObservedBrowser(1, signal);
    observed.pause = async () => {};
    observed.observe = async () => page.evaluate(() => delightAutomation.observe());
    await page.evaluate(() => document.querySelector('[role=status]').textContent = '');
    const state = await observed.observe();
    const submitted = await observed.act({ type: 'sendKeys', elementIndex: 0, data: { keys: 'Enter' } }, state);
    assert.equal(submitted.submission, 'status-observed');
    assert.equal(await page.evaluate(() => window.submissions), 2);
    const verified = await observed.act({ type: 'verify', data: { kind: 'text', text: 'Saved successfully' } }, await observed.observe());
    assert.equal(verified.verified, true);
    console.log('PASS: real Chromium native Enter validation/submission, Ctrl+A, trusted-only click, debugger cleanup. Chrome extension API is mocked with a live CDP session.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
