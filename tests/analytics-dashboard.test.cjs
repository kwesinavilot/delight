const {test}=require('node:test');
const assert=require('node:assert/strict');
const {provision}=require('../scripts/posthog-dashboard.cjs');
const definition=require('../scripts/posthog-dashboard-definition.cjs');
test('dashboard preview needs no credentials or network',async()=>{
 const result=await provision({fetchImpl:()=>{throw new Error('Network called');}});
 assert.equal(result.dryRun,true);
 assert.equal(result.insights.length,14);
 for(const item of definition.insights){assert.match(item.query.source.query,/analytics_schema_version = 2/);assert.match(item.query.source.query,/environment = 'production'/);}
});
test('dashboard provisioning validates queries first and is idempotent across retries',async()=>{
 let dashboard, tiles=[], writes=0, queries=0;
 const fetchImpl=async(url,options)=>{
  const path=new URL(url).pathname, data=options.body&&JSON.parse(options.body);
  assert.equal(options.redirect,'error');
  let value;
  if(path.endsWith('/query/')){queries++;value={results:[[1]]};}
  else if(path.endsWith('/dashboards/')&&options.method==='GET')value={results:dashboard?[dashboard]:[],next:null};
  else if(path.endsWith('/dashboards/')){writes++;dashboard={id:7,...data};value=dashboard;}
  else if(path.endsWith('/dashboards/7/'))value={...dashboard,tiles};
  else if(path.endsWith('/insights/')){writes++;tiles.push({insight:data});value={id:tiles.length};}
  else throw new Error(path);
  return {ok:true,json:async()=>value};
 };
 const config={host:'https://us.posthog.com',projectId:1,key:'fixture-admin',apply:true,fetchImpl};
 const first=await provision(config);
 assert.equal(first.createdInsights,14);
 const second=await provision(config);
 assert.equal(second.createdInsights,0);
 assert.equal(writes,15);
 assert.equal(queries,28);
});
test('invalid queries stop all dashboard mutations and HTTP errors do not expose response bodies',async()=>{
 let requests=0;
 await assert.rejects(provision({projectId:1,key:'fixture',apply:true,fetchImpl:async()=>{requests++;return {ok:false,status:400,json:async()=>({secret:'private'})};}}),error=>!error.message.includes('private')&&/HTTP 400/.test(error.message));
 assert.equal(requests,1);
});
