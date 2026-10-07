const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
function loadDb() {
 const calls=[];
 const current={id:'post',slug:'post',ownerId:'alice',shareLocation:false,isPublished:false,photos:[],title:'사진',description:'기록',location:'위치 비공개',date:'2026-10-04',createdAt:'2026-10-04T00:00:00Z'};
 const photo={id:'photo_0',order:0,gps:null,urls:{medium:'url'}};
 const entries=new Map([['sessions/post',current],['sessions/post/photos/photo_0',photo],['sessions/post/comments/comment_0',{id:'comment_0'}]]);
 const privacy={};new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/session-privacy.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(privacy);
 const sdk={
  doc:(_db,...parts)=>parts.join('/'),collection:(_db,...parts)=>parts.join('/'),where:(...args)=>args,orderBy:(...args)=>args,
  query:(path,...filters)=>({path,filters}),
  getDoc:async path=>({exists:()=>entries.has(path),data:()=>entries.get(path),id:path.split('/').pop()}),
  getDocs:async input=>{
   const path=typeof input==='string'?input:input.path;
   calls.push(['query',path]);
   const docs=[...entries].filter(([key])=>key.startsWith(path+'/')&&key.split('/').length===path.split('/').length+1).map(([key,value])=>({id:key.split('/').pop(),ref:key,data:()=>value}));
   return {docs,forEach:fn=>docs.forEach(fn)};
  },
  setDoc:async(path,value,options)=>calls.push(['set',path,value,options]),deleteDoc:async path=>calls.push(['delete',path]),
  writeBatch:()=>({set:(path,value)=>calls.push(['batch-set',path,value]),delete:path=>calls.push(['batch-delete',path]),commit:async()=>calls.push('commit')})
 };
 const modules={
  './firebase':{db:{},storage:{},isFirebaseConfigured:true,auth:{currentUser:{uid:'alice'}}},
  'firebase/firestore':sdk,'firebase/storage':{ref:(_s,path)=>path,deleteObject:async path=>calls.push(['delete-object',path])},
  './session-privacy':privacy,'./storage-cleanup':{removeStorageTree:async path=>calls.push(['delete-tree',path])},
  './mock-data':{INITIAL_MOCK_SESSIONS:[]},'./demo-locations':{withDemoCoordinates:item=>item},
 };
 const api={};new Function('exports','require',ts.transpileModule(fs.readFileSync('src/lib/db.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(api,name=>modules[name]);
 return {api,calls,current,entries,photo};
}
test('member save atomically writes private parent and sanitized photo metadata',async()=>{
 const {api,calls,current}=loadDb();
 await api.saveSession({...current,location:'집',gps:{latitude:37,longitude:127},photos:[{id:'replacement',order:1,gps:{latitude:37,longitude:127},location:'집',urls:{medium:'url'}}]});
 const writes=calls.filter(item=>item[0]==='batch-set');
 assert.equal(writes[0][1],'sessions/post');assert.deepEqual(writes[0][2].photos,[]);assert.equal(writes[0][2].photoCount,1);assert.equal(writes[0][2].gps,null);
 assert.equal(writes[1][1],'sessions/post/photos/replacement');assert.equal(writes[1][2].gps,null);assert.equal(writes[1][2].location,'');
 assert.ok(calls.some(item=>item[0]==='batch-delete'&&item[1]==='sessions/post/photos/photo_0'));assert.equal(calls.at(-1),'commit');
});
test('member read restores photo arrays while legacy save keeps the existing schema',async()=>{
 const {api,calls,current,photo}=loadDb();
 assert.deepEqual((await api.fetchSessionByIdOrSlug('post')).photos,[photo]);
 const legacy={...current,photos:[photo]};delete legacy.ownerId;delete legacy.shareLocation;
 await api.saveSession(legacy);
 const write=calls.find(item=>item[0]==='set');assert.deepEqual(write[2].photos,[photo]);assert.equal('ownerId'in write[2],false);
});
test('deleting a member post removes files and child documents before its parent',async()=>{
 const {api,calls}=loadDb();await api.deleteSession('post');
 const actions=calls.filter(item=>item[0]!=='query');
 assert.deepEqual(actions,[['delete-tree','members/alice/sessions/post'],['batch-delete','sessions/post/photos/photo_0'],'commit',['batch-delete','sessions/post/comments/comment_0'],'commit',['delete','sessions/post']]);
});
test('client deletion refuses another member before touching any file',async()=>{
 const {api,calls,entries,current}=loadDb();entries.set('sessions/post',{...current,ownerId:'bob'});
 await assert.rejects(api.deleteSession('post'),/권한/);assert.deepEqual(calls,[]);
});
