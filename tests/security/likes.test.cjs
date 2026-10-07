const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const {initializeApp,deleteApp}=require('firebase-admin/app');
const {getFirestore,Timestamp}=require('firebase-admin/firestore');
function load(path, custom=require) {
  const api={exports:{}};
  const source=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('exports','require',source)(api.exports,custom);return api.exports;
}
const identity=load('src/lib/server/like-identity.ts');
const api=load('src/lib/server/likes.ts',name=>name==='./like-identity'?identity:require(name));
let app,db;
const secret='test-secret-for-likes-only-32-characters';
before(async()=>{
  // Dedicated emulator project prevents interference with rule tests clearing their database.
  app=initializeApp({projectId:'demo-photo-likes'},'likes-test');db=getFirestore(app);
  await db.doc('sessions/public').set({isPublished:true});
  await db.doc('sessions/draft').set({isPublished:false});
});
after(async()=>{await deleteApp(app);});
test('concurrent likes from one IP count once, retries are idempotent, other IP adds one',async()=>{
  const results=await Promise.all(Array.from({length:6},()=>api.setLike(db,'public','192.0.2.1',secret,true)));
  assert.ok(results.every(result=>result.count===1&&result.liked));
  assert.deepEqual(await api.setLike(db,'public','192.0.2.2',secret,true),{count:2,liked:true});
  const mine=await api.readLikes(db,['public','draft','missing'],'192.0.2.1',secret);
  assert.deepEqual(mine,{public:{count:2,liked:true}});
  const other=await api.readLikes(db,['public'],'192.0.2.3',secret);
  assert.deepEqual(other.public,{count:2,liked:false});
  await db.doc(`likeVotes/public/voters/${identity.voterKey('192.0.2.1','public',secret)}`).update({updatedAt:Timestamp.now()});
  await assert.rejects(api.setLike(db,'public','192.0.2.1',secret,false),error=>error.status===429);
  await db.doc(`likeVotes/public/voters/${identity.voterKey('192.0.2.1','public',secret)}`).update({updatedAt:Timestamp.fromMillis(0)});
  assert.deepEqual(await api.setLike(db,'public','192.0.2.1',secret,false),{count:1,liked:false});
  assert.deepEqual(await api.setLike(db,'public','192.0.2.1',secret,false),{count:1,liked:false});
});
test('draft and missing posts cannot be liked; unliking a never-liked post stays zero',async()=>{
  for(const id of ['draft','missing']) await assert.rejects(api.setLike(db,id,'192.0.2.3',secret,true),error=>error.status===404);
  await db.doc('sessions/empty').set({isPublished:true});
  assert.deepEqual(await api.setLike(db,'empty','192.0.2.3',secret,false),{count:0,liked:false});
});
