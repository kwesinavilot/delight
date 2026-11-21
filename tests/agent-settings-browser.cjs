const {chromium}=require('playwright-core');
const esbuild=require('esbuild');
const assert=require('node:assert/strict');
(async()=>{
 const bundle=await esbuild.build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import Settings from './src/components/Settings/SettingsPanel'; createRoot(document.getElementById('root')).render(<Settings/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'services',setup(build){
 build.onResolve({filter:/AIService$|ConfigManager$|ProviderSetup$|PostHogService$|NetworkStatusPanel$/},args=>({path:args.path,namespace:'mock'}));
 build.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`export const AIService={getInstance:()=>({})}; export const ConfigManager={getInstance:()=>({getAllConfigurations:async()=>({}),getCurrentProvider:async()=>''})}; export const listGeminiModels=async()=>[]; export const testProviderConfiguration=async()=>{}; export default function Mock(){return null;}`}));
 }}]});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const page=await browser.newPage();
 await page.route('https://settings.test/**',r=>r.fulfill({contentType:'text/html',body:'<div id="root"></div>'}));
 await page.goto('https://settings.test/');
 await page.evaluate(()=>{window.disk={};window.chrome={runtime:{getManifest:()=>({version:'test'})},storage:{local:{get:async()=>window.disk,set:async value=>Object.assign(window.disk,value)},sync:{get:async()=>({})}}};});
 await page.addScriptTag({content:bundle.outputFiles[0].text});
 await page.getByRole('button',{name:'AI Providers',exact:true}).click();
 const notice=page.getByText('API keys stay in this browser profile on this machine.',{exact:false});
 await notice.waitFor();
 assert.equal(await notice.evaluate(el=>el===el.parentElement.firstElementChild),true);
 await page.getByRole('button',{name:'Agent',exact:true}).click();
 assert.equal(await page.getByLabel('Maximum turns',{exact:true}).inputValue(),'50');
 await page.getByLabel('Maximum turns',{exact:true}).fill('3');
 await page.getByLabel('Custom instructions',{exact:true}).fill('My company is Acme GmbH. Answer briefly.');
 assert.equal(await page.getByLabel('Custom instructions',{exact:true}).getAttribute('maxlength'),'1500');
 await page.getByRole('button',{name:'Save agent settings'}).click();
 await page.getByRole('status').filter({hasText:'Agent settings saved'}).waitFor();
 assert.deepEqual(await page.evaluate(()=>window.disk.agentSettings),{maximumTurns:3,customInstructions:'My company is Acme GmbH. Answer briefly.'});
 console.log('Settings UI passed: provider notice placement, Agent tab, defaults, character limit, saved preferences.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

