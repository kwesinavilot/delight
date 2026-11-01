const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext();
    await context.route('https://tabs.test/**', route => route.fulfill({ contentType: 'text/html',
      body: new URL(route.request().url()).pathname === '/child' ? '<title>Child page</title><button>Child control</button>' : '<a href="/child" target="_blank" rel="noopener">Open child</a>' }));
    const page = await context.newPage();
    await page.goto('https://tabs.test/');
    await page.addScriptTag({ path: 'public/automation-runtime.js' });
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.evaluate(() => {
        const runtime = globalThis.delightAutomation;
        const state = runtime.observe();
        const link = state.elements.find(element => element.text === 'Open child');
        if (link.target !== '_blank') throw new Error('Missing link target metadata');
        runtime.act({ type: 'click', elementIndex: link.index }, state.revision);
      })
    ]);
    await popup.waitForLoadState();
    assert.equal(popup.url(), 'https://tabs.test/child');
    await popup.addScriptTag({ path: 'public/automation-runtime.js' });
    const child = await popup.evaluate(() => globalThis.delightAutomation.observe());
    assert.equal(child.elements[0].text, 'Child control');
    assert.equal(context.pages().length, 2);
    console.log('PASS: packaged runtime opens one noopener popup and observes controls in the child page (real Chromium)');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
