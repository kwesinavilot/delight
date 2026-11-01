const { chromium } = require('playwright-core');
const esbuild = require('esbuild');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const historyPath = path.resolve('src/services/agents/AgentHistory.ts').replaceAll('\\', '/');
  const output = await esbuild.build({
    stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client';
      import AgentPage from './src/components/Agent/AgentPage';
      function App() { const [open, setOpen] = React.useState(true); return open ? <AgentPage onBack={() => setOpen(false)} /> : <button onClick={() => setOpen(true)}>Open Agent</button>; }
      createRoot(document.getElementById('root')).render(<App />);`, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{ name: 'mock-runtime', setup(build) {
      build.onResolve({ filter: /AgentOrchestrator$/ }, () => ({ path: 'runtime', namespace: 'mock' }));
      build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `
        import { agentHistory } from ${JSON.stringify(historyPath)};
        let active;
        const instance = {
          async executeTask(input) {
            active = crypto.randomUUID();
            await agentHistory.start(active, input);
            agentHistory.steps(active, [{id:'step',type:'click',description:'Click Music',status:'completed'}]);
            agentHistory.event(active, 'Clicked Music', 'success');
            if (input !== 'keep running') { await agentHistory.finish(active, 'completed', 'Playback verified'); active = undefined; }
          },
          async stopCurrentTask() { if (active) { const id = active; active = undefined; await agentHistory.finish(id, 'cancelled', 'Task cancelled.'); } }
        };
        export const AgentOrchestrator = { getInstance: () => instance };`, loader: 'js', resolveDir: process.cwd() }));
    } }]
  });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    await page.route('https://history.test/**', route => route.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' }));
    await page.goto('https://history.test/');
    await page.evaluate(() => {
      const disk = {};
      window.chrome = { storage: { local: { get: async () => structuredClone(disk), set: async value => Object.assign(disk, structuredClone(value)) } } };
    });
    await page.addScriptTag({ content: output.outputFiles[0].text });
    await page.getByRole('textbox', { name: 'Browser task' }).fill('play music');
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await page.getByText('Playback verified', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('button', { name: 'Open Agent' }).click();
    await page.getByText('Playback verified', { exact: true }).waitFor();
    assert.equal(await page.getByText('Click Music', { exact: false }).count() > 0, true);
    await page.getByRole('textbox', { name: 'Browser task' }).fill('keep running');
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('button', { name: 'Open Agent' }).click();
    await page.getByText('Task cancelled.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Clear saved history', exact: true }).click();
    await page.getByRole('option', { name: 'No saved tasks' }).waitFor({ state: 'attached' });
    console.log('PASS: Agent history survives remount, leaving cancels active runs, saved history clears (mock runtime)');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
