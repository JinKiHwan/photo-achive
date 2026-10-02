const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const api = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/parallel.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(api);
test('bounds simultaneous jobs, retains order, and continues after failure', async () => {
 let active=0, peak=0;
 const completed=[];
 const results=await api.mapConcurrent([40,5,10,5,5],2,async (delay,index)=>{
  active++; peak=Math.max(peak,active);
  await new Promise(resolve=>setTimeout(resolve,delay));
  active--; completed.push(index);
  if(index===2) throw new Error('one failed');
  return index;
 });
 assert.equal(peak,2);
 assert.notDeepEqual(completed,[0,1,2,3,4]);
 assert.deepEqual(results.map(r=>r.status==='fulfilled'?r.value:'failed'),[0,1,'failed',3,4]);
 assert.equal(active,0);
 assert.deepEqual(await api.mapConcurrent([],3,async()=>0),[]);
});
