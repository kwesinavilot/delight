const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    await page.route('https://automation.test/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
    await page.goto('https://automation.test/');
    await page.setContent('<input aria-label="Search"><button onclick="document.querySelector(\'output\').textContent=document.querySelector(\'input\').value">Find</button><output></output>');
    await page.addScriptTag({ path: 'public/automation-runtime.js' });
    const result = await page.evaluate(() => {
      const runtime = globalThis.delightAutomation;
      const first = runtime.observe();
      runtime.act({ type: 'fill', elementIndex: first.elements.find(e => e.label === 'Search').index, data: 'cats' }, first.revision);
      const second = runtime.observe();
      runtime.act({ type: 'click', elementIndex: second.elements.find(e => e.text === 'Find').index }, second.revision);
      return runtime.observe();
    });
    assert.match(result.text, /cats/);
    assert.equal(result.elementCount, 2);
    console.log('PASS: real Chromium DOM observation, native input filling, clicking, and re-observation');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
