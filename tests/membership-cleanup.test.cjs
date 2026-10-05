const { test }=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
function load(overrides={}) {
 const calls=[];
 const user={uid:'alice'};
 const modules={
  'firebase/auth':{GoogleAuthProvider:class {},reauthenticateWithPopup:async()=>calls.push('reauth'),deleteUser:async()=>calls.push('delete-auth')},
  'firebase/firestore':{
   doc:(_db,...parts)=>parts.join('/'),collection:(_db,...parts)=>parts.join('/'),query:(ref)=>ref,where:()=>null,
   getDoc:async()=>({exists:()=>true,data:()=>({deleting:false,policyVersion:'2026-10-04'})}),
   setDoc:async(path,data)=>calls.push(['set',path,data]), deleteDoc:async(path)=>calls.push(['delete-doc',path]),
   getDocs:async()=>({docs:[{ref:'reports/alice_post'}]}),serverTimestamp:()=> 'server-time',
   writeBatch:()=>({delete:path=>calls.push(['delete-report',path]),commit:async()=>calls.push('commit')})
  },
  'firebase/storage':{ref:(_storage,path)=>path},
  './firebase':{auth:{currentUser:user},db:{},storage:{}},
  './storage-cleanup':{removeStorageTree:async(path)=>calls.push(['delete-storage',path])},
  './community-config':{POLICY_VERSION:'2026-10-04'},
  './db':{fetchOwnedSessions:async()=>[{id:'post'}],deleteSession:async(id)=>calls.push(['delete-session',id])},
 };
 for(const [module,override]of Object.entries(overrides)) modules[module]={...modules[module],...override};
 const api={};new Function('exports','require',ts.transpileModule(fs.readFileSync('src/lib/membership.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(api,name=>modules[name]);
 return {api,calls};
}
test('withdrawal verifies identity, freezes writes and deletes data before the auth account',async()=>{
 const {api,calls}=load();await api.withdrawMembership();
 assert.deepEqual(calls,[ 'reauth',['set','members/alice',{deleting:true}],['delete-session','post'],['delete-storage','members/alice'],['delete-report','reports/alice_post'],'commit',['delete-doc','members/alice'],'delete-auth']);
});
test('failed reauthentication performs no deletion',async()=>{
 const {api,calls}=load({'firebase/auth':{reauthenticateWithPopup:async()=>{throw new Error('cancelled')}}});
 await assert.rejects(api.withdrawMembership(),/cancelled/);assert.deepEqual(calls,[]);
});
test('partial cleanup failure preserves authentication and private membership for retry',async()=>{
 const {api,calls}=load({'./db':{deleteSession:async()=>{throw new Error('offline')}}});
 await assert.rejects(api.withdrawMembership(),/offline/);
 assert.deepEqual(calls,['reauth',['set','members/alice',{deleting:true}]]);
});
test('idempotent policy acceptance does not reset deletion or rewrite existing acceptance',async()=>{
 const {api,calls}=load();await api.acceptMembership({uid:'alice'});assert.deepEqual(calls,[]);
 const pending=load({'firebase/firestore':{getDoc:async()=>({exists:()=>true,data:()=>({deleting:true})})}});
 await assert.rejects(pending.api.acceptMembership({uid:'alice'}),/탈퇴/);assert.deepEqual(pending.calls,[]);
});
