const {chromium}=require('playwright-core');
const esbuild=require('esbuild');
const assert=require('node:assert/strict');
(async()=>{
 const build=await esbuild.build({stdin:{contents:`import analytics from './src/services/PostHogService'; import sdk from 'posthog-js/dist/module.full.no-external'; window.analytics=analytics; window.sdk=sdk; analytics.trackPage('sidepanel');`,resolveDir:process.cwd()},bundle:true,write:false,format:'iife',define:{'import.meta.env.VITE_PUBLIC_POSTHOG_KEY':'"phc_fixture_only"','import.meta.env.VITE_PUBLIC_POSTHOG_HOST':'"https://posthog.test"','import.meta.env.VITE_PUBLIC_ANALYTICS_ENVIRONMENT':'"test"','import.meta.env.DEV':'false','process.env.NODE_ENV':'"production"'}});
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}), payloads=[];
  await page.route('**/*',async route=>{
   const request=route.request(), url=new URL(request.url());
   if(url.host==='analytics.test')return route.fulfill({contentType:'text/html',body:'<div>Private page contents</div>'});
   if(url.host!=='posthog.test')return route.abort();
   const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'POST, OPTIONS'};
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
   const raw=request.postData()||'', encoded=new URLSearchParams(raw).get('data');
   let parsed;
   for(const candidate of [raw,encoded,encoded&&Buffer.from(encoded,'base64').toString('utf8')]){if(!candidate)continue;try{parsed=JSON.parse(candidate);break;}catch{}}
   if(!parsed)throw new Error('Could not decode capture payload');
   payloads.push(...(Array.isArray(parsed)?parsed:parsed.batch||[parsed]));
   return route.fulfill({status:200,contentType:'application/json',headers,body:'{"status":1}'});
  });
  await page.goto('https://analytics.test/private?secret=private');
  await page.evaluate(()=>{
   const disk={analyticsOptIn:false},listeners=[];
   window.chrome={runtime:{getManifest:()=>({version:'1.5.0'})},storage:{local:{get:async()=>({...disk}),set:async value=>{Object.assign(disk,value);listeners.forEach(fn=>fn({analyticsOptIn:{newValue:disk.analyticsOptIn}},'local'));}},onChanged:{addListener:fn=>listeners.push(fn)}}};
  });
  await page.addScriptTag({content:build.outputFiles[0].text});
  // Wait for the async consent read; a fixture promise, not a live network dependency.
  await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,100)));
  assert.equal(payloads.length,0);
  await page.evaluate(async()=>{
   await window.analytics.setEnabled(true);
   window.sdk.set_config({request_batching:false,disable_compression:true});
   await new Promise(resolve=>setTimeout(resolve,200));
   window.analytics.track('provider_connection_tested',{purpose:'agent',provider:'groq',model:'openai/gpt-oss-20b',outcome:'success',duration_ms:123,prompt:'private',api_key:'private',url:location.href});
  });
  await page.waitForFunction(()=>window.sdk.has_opted_in_capturing());
  for(let i=0;i<100&&!payloads.length;i++)await new Promise(resolve=>setTimeout(resolve,50));
  if(!payloads.length) console.log(await page.evaluate(()=>({ready:window.analytics.sdkReady,initialized:window.analytics.initialized,opted:window.sdk.has_opted_in_capturing(),loaded:window.sdk.__loaded,pending:window.analytics.pending.length})));
  assert.equal(payloads.length,1);
  assert.equal(payloads[0].event,'provider_connection_tested');
  assert.equal(payloads[0].properties.environment,'test');
  assert.equal(payloads[0].properties.analytics_schema_version,2);
  assert.ok(!JSON.stringify(payloads).includes('private'));
  assert.equal(payloads[0].properties.$process_person_profile,false);
  assert.equal(payloads[0].$set,undefined);
  assert.equal(payloads[0].$set_once,undefined);
  await page.evaluate(async()=>{await window.analytics.setEnabled(false);window.analytics.track('onboarding_completed');});
  await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,100)));
  assert.equal(payloads.length,1);
  console.log('Analytics browser passed: real bundled SDK, no pre-consent requests, filtered outbound capture, schema/environment, and opt-out. Capture endpoint mocked; live ingestion unverified.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
