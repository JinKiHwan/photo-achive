const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
function load(currentUser={uid:'alice'}) {
 const calls=[];
 const firestore={
  collection:(_db,...parts)=>parts.join('/'),
  doc:(first,...parts)=>typeof first==='string'&&!parts.length?{path:`${first}/comment_1`,id:'comment_1'}:parts.join('/'),
  query:ref=>ref,orderBy:()=>null,serverTimestamp:()=> 'server-time',
  setDoc:async(path,data)=>calls.push(['set',path.path||path,data]),updateDoc:async(path,data)=>calls.push(['update',path,data]),deleteDoc:async path=>calls.push(['delete',path]),
  getDocs:async()=>({docs:[{data:()=>({id:'comment_1',sessionId:'post',authorId:'alice',body:'hello'})}]})
 };
 const api={};
 new Function('exports','require',ts.transpileModule(fs.readFileSync('src/lib/comments.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(api,name=>name==='firebase/firestore'?firestore:name==='./firebase'?{auth:{currentUser},db:{}}:{});
 return {api,calls};
}
test('comment writes trim content and scope paths to a session',async()=>{
 const {api,calls}=load();
 await api.addComment('post','  새 댓글  ');
 await api.updateComment('post','comment_1','  수정  ');
 await api.deleteComment('post','comment_1');
 assert.deepEqual(calls,[
  ['set','sessions/post/comments/comment_1',{id:'comment_1',sessionId:'post',authorId:'alice',body:'새 댓글',createdAt:'server-time',updatedAt:'server-time'}],
  ['update','sessions/post/comments/comment_1',{body:'수정',updatedAt:'server-time'}],
  ['delete','sessions/post/comments/comment_1']
 ]);
});
test('comment writes require login and valid bounded content',async()=>{
 const signed=load();
 await assert.rejects(signed.api.addComment('post','   '),/1~500/);
 await assert.rejects(signed.api.updateComment('post','comment_1','x'.repeat(501)),/1~500/);
 const guest=load(null);
 await assert.rejects(guest.api.addComment('post','hello'),/로그인/);
 await assert.rejects(guest.api.deleteComment('post','comment_1'),/로그인/);
});
