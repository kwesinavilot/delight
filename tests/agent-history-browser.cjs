const { chromium } = require('playwright-core');
const esbuild = require('esbuild');
const assert = require('node:assert/strict');
(async () => {
  const output = await esbuild.build({
    stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client';
      import AgentPage from './src/components/Agent/AgentPage';
      function App() { const [open, setOpen] = React.useState(true); return open ? <AgentPage onBack={() => setOpen(false)} /> : <button onClick={() => setOpen(true)}>Open Agent</button>; }
      createRoot(document.getElementById('root')).render(<App />);`, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{ name: 'mock-planner', setup(build) {
      build.onResolve({ filter: /PlannerAgent$/ }, () => ({ path: 'planner', namespace: 'mock' }));
      build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `export class PlannerAgent {
        async initialize() {} async decide(input, state, history, signal) {
          if (input === 'finish task') return { done: true, success: true, evidence: 'Task outcome verified' };
          await new Promise((resolve, reject) => { signal.addEventListener('abort', () => reject(new Error('Aborted')), {once:true}); });
        }
      }` }));
    } }]
  });
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    await page.route('https://history.test/**', route => route.fulfill({ contentType: 'text/html', body: '<div id="root"></div>' }));
    await page.goto('https://history.test/');
    await page.evaluate(() => {
      const disk = {}, tabs = new Map([[1, {id:1, windowId:1, url:'https://example.com', title:'Attached page'}]]);
      window.chrome = {
        storage: { local: { get: async () => structuredClone(disk), set: async value => Object.assign(disk, structuredClone(value)) } },
        tabs: { query: async () => [...tabs.values()], get: async id => tabs.get(id), create: async props => { const tab = { id:tabs.size+1, windowId:1, ...props }; tabs.set(tab.id,tab); return tab; } },
        scripting: { executeScript: async ({files}) => files ? [] : [{result:JSON.stringify({revision:'test',url:'https://example.com',elements:[]})}] }
      };
    });
    await page.addScriptTag({ content: output.outputFiles[0].text });
    await page.getByRole('heading', {name:'What can I do for you?'}).waitFor();
    await page.getByRole('button', {name:'Research a topic',exact:true}).click();
    assert.match(await page.getByRole('textbox').inputValue(), /Research/);
    await page.getByRole('textbox').fill('first agent');
    await page.getByRole('button', {name:'Attach current page'}).click();
    await page.getByText('Attached page', {exact:true}).waitFor();
    await page.getByRole('button', {name:'Run',exact:true}).click();
    await page.getByText('Thinking', {exact:true}).waitFor();
    assert.equal(await page.locator('details').getAttribute('open'), null);
    await page.getByRole('button', {name:'New',exact:true}).click();
    await page.getByRole('textbox').fill('second agent');
    await page.getByRole('button', {name:'Run',exact:true}).click();
    await page.getByRole('button', {name:'2 active'}).waitFor();
    await page.getByRole('button', {name:'Back',exact:true}).click();
    await page.getByRole('button', {name:'Open Agent'}).click();
    await page.getByRole('button', {name:'2 active'}).click();
    await page.getByRole('button').filter({hasText:'first agent'}).first().click();
    await page.getByRole('button', {name:'Pause',exact:true}).click();
    await page.getByRole('button', {name:'Resume',exact:true}).waitFor();
    await page.getByRole('button', {name:'Stop',exact:true}).click();
    await page.getByRole('button', {name:'1 active'}).waitFor();
    await page.getByRole('button', {name:'New',exact:true}).click();
    await page.getByRole('textbox').fill('finish task');
    await page.getByRole('button', {name:'Run',exact:true}).click();
    await page.getByText('Task outcome verified',{exact:true}).waitFor();
    assert.equal(await page.locator('details').getAttribute('open'), null);
    console.log('Agent browser checks passed: suggestions, attachments, concurrent runs, navigation, isolated controls, collapsed activity, final outcome.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });



