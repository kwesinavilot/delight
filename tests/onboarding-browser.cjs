const { chromium } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    let limited = true;
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === 'delight.test') {
        const file = path.resolve('dist', '.' + decodeURIComponent(url.pathname));
        if (!file.startsWith(path.resolve('dist') + path.sep)) return route.abort();
        const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream';
        try { return route.fulfill({ contentType: type, body: await fs.readFile(file) }); } catch { return route.fulfill({ status: 404, body: '' }); }
      }
      if (url.hostname === 'api.groq.com') {
        if (limited) return route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Rate limit reached', type: 'rate_limit_error' } }) });
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'test', object: 'chat.completion', created: 1, model: 'openai/gpt-oss-20b', choices: [{ index: 0, message: { role: 'assistant', content: 'OK' }, finish_reason: 'stop' }], usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 } }) });
      }
      return route.abort();
    });
    await page.addInitScript(() => {
      const local = {}, sync = {};
      const area = data => ({
        get: async keys => Object.fromEntries((Array.isArray(keys) ? keys : [keys]).filter(key => key in data).map(key => [key, data[key]])),
        set: async value => Object.assign(data, value),
        remove: async keys => (Array.isArray(keys) ? keys : [keys]).forEach(key => delete data[key])
      });
      globalThis.setupStorage = { local, sync };
      globalThis.chrome = {
        runtime: { getManifest: () => ({ version: '1.4.5' }), getURL: p => `https://delight.test/${p}` },
        windows: { getCurrent: async () => ({ id: 1 }) },
        sidePanel: { open: async () => { globalThis.panelOpened = true; } },
        storage: { local: area(local), sync: area(sync), onChanged: { addListener() {}, removeListener() {} } }
      };
      window.close = () => {};
    });
    await page.goto('https://delight.test/src/pages/welcome/index.html');
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next', exact: true }).click();
    const start = page.getByRole('button', { name: 'Get Started', exact: true });
    assert.equal(await start.isDisabled(), true);
    await page.getByLabel('API key', { exact: true }).fill('gsk_fake_test_key');
    await page.getByRole('button', { name: 'Test and save connection' }).click();
    await page.getByRole('status').filter({ hasText: 'quota or rate limit' }).waitFor();
    assert.equal(await start.isDisabled(), true);
    assert.equal(await page.evaluate(() => !!setupStorage.local.aiSettings), false);
    limited = false;
    await page.getByRole('button', { name: 'Test and save connection' }).click();
    await page.getByRole('status').filter({ hasText: 'Connection verified' }).waitFor();
    assert.equal(await start.isEnabled(), true);
    await start.click();
    await page.waitForFunction(() => setupStorage.local.welcomeCompleted === true);
    const data = await page.evaluate(() => ({ local: setupStorage.local, sync: setupStorage.sync, opened: panelOpened }));
    assert.equal(data.local.aiSettings.ai.currentProvider, 'groq');
    assert.equal(data.local.aiSettings.ai.providers.groq.apiKey, 'gsk_fake_test_key');
    assert.equal(data.sync.aiSettings, undefined);
    assert.equal(data.opened, true);
    console.log('PASS: four-step onboarding, failed/successful model test, local-only saving, and Get Started (mock provider, no live quota)');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
