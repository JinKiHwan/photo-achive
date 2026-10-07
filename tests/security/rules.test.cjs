const { before, after, beforeEach, test } = require('node:test');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, collection, query, where, serverTimestamp, writeBatch } = require('firebase/firestore');
const { ref, uploadBytes, getBytes, listAll, deleteObject } = require('firebase/storage');
const fs = require('node:fs');
const admin = '8eI45u6PWlWlEdZ1c5qfBH0lHMW2';
let env;
const session = (ownerId='alice', id='post') => ({ id, slug:id, ownerId, title:'출사', date:'2026-10-04', location:'위치 비공개', description:'기록', isPublished:false, shareLocation:false, photos:[], photoCount:0, createdAt:'2026-10-04T00:00:00Z', updatedAt:'2026-10-04T00:00:00Z' });
const photo = (i, owner='alice', id='post') => {
  const base = `members/${owner}/sessions/${id}/photo_${i}`;
  const names = ['thumb','medium','large'];
  return { id:`photo_${i}`, order:i, caption:'캡션', gps:null, exif:{camera:'Camera',iso:'ISO 100',aperture:'f/2.8',shutter:'1/100s',focalLength:'35mm'}, width:4000,height:3000,aspectRatio:1.33,
    storagePaths:Object.fromEntries(names.map(n => [n,`${base}/${n}.webp`])),
    urls:Object.fromEntries(names.map(n=>[n,`https://firebasestorage.googleapis.com/v0/b/demo-photo-archive.appspot.com/o/${encodeURIComponent(`${base}/${n}.webp`)}?alt=media&token=test`])) };
};
const user = uid => env.authenticatedContext(uid, {email_verified:true, firebase:{sign_in_provider:'google.com'}});
const db = uid => user(uid).firestore();
before(async () => {
  env = await initializeTestEnvironment({projectId:'demo-photo-archive', firestore:{host:'127.0.0.1',port:8085,rules:fs.readFileSync('firestore.rules','utf8')}, storage:{host:'127.0.0.1',port:9195,rules:fs.readFileSync('storage.rules','utf8')}});
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const store=context.firestore();
    await setDoc(doc(store,'config/community'),{enabled:true});
    for(const uid of ['alice','bob']) await setDoc(doc(store,'members',uid),{policyVersion:'2026-10-04',acceptedAt:new Date(),deleting:false});
    await setDoc(doc(store,'sessions/post'),session());
    await setDoc(doc(store,'sessions/public'),{...session('bob','public'),isPublished:true});
    const legacy=session(undefined,'legacy'); delete legacy.ownerId; delete legacy.shareLocation;
    await setDoc(doc(store,'sessions/legacy'),legacy);
  });
});
test('public readers see published posts, cannot read drafts or list all posts', async()=>{
  const store=env.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(store,'sessions/public')));
  await assertFails(getDoc(doc(store,'sessions/post')));
  await assertFails(getDocs(collection(store,'sessions')));
  await assertSucceeds(getDocs(query(collection(store,'sessions'),where('isPublished','==',true))));
});
test('owner-filtered query and admin query succeed; other member cannot edit or delete',async()=>{
  await assertSucceeds(getDocs(query(collection(db('alice'),'sessions'),where('ownerId','==','alice'))));
  await assertSucceeds(getDocs(collection(db(admin),'sessions')));
  await assertFails(updateDoc(doc(db('bob'),'sessions/post'),{title:'steal'}));
  await assertFails(deleteDoc(doc(db('bob'),'sessions/post')));
  await assertFails(getDoc(doc(db('bob'),'sessions/post')));
});
test('ownership cannot be forged or changed; legacy documents remain admin-only',async()=>{
  await assertFails(setDoc(doc(db('alice'),'sessions/new'),session('bob','new')));
  await assertFails(updateDoc(doc(db('alice'),'sessions/post'),{ownerId:'bob'}));
  await assertFails(updateDoc(doc(db('alice'),'sessions/legacy'),{ownerId:'alice'}));
  await assertSucceeds(updateDoc(doc(db(admin),'sessions/legacy'),{title:'관리자 수정'}));
});
test('member photo subcollection validates 12 independent photos in one batch',async()=>{
  const store=db('alice');
  const batch=writeBatch(store);
  batch.set(doc(store,'sessions/new'),{...session('alice','new'),photoCount:12});
  for(let i=0;i<12;i++) batch.set(doc(store,`sessions/new/photos/photo_${i}`),photo(i,'alice','new'));
  await assertSucceeds(batch.commit());
  await assertSucceeds(updateDoc(doc(store,'sessions/new'),{title:'수정'}));
  await assertFails(updateDoc(doc(store,'sessions/new'),{photoCount:13}));
  await assertFails(updateDoc(doc(store,'sessions/new/photos/photo_11'),{caption:'x'.repeat(2001)}));
  await assertFails(updateDoc(doc(db('bob'),'sessions/new/photos/photo_0'),{caption:'other user'}));
  await assertSucceeds(getDocs(query(collection(env.unauthenticatedContext().firestore(),'sessions/public/photos'),where('gps','==',null))));
});
test('type changes, schema pollution, missing fields and immutable timestamps fail',async()=>{
  const target=doc(db('alice'),'sessions/post');
  for(const change of [{title:3},{title:'x'.repeat(301)},{unknown:'value'},{createdAt:'2030-01-01'},{slug:'another'},{photos:['bad']}]) await assertFails(updateDoc(target,change));
  const invalid=session('alice','missing'); delete invalid.title;
  await assertFails(setDoc(doc(db('alice'),'sessions/missing'),invalid));
});
test('private location cannot hide live GPS in nested photos and storage URLs are scoped',async()=>{
  const store=db('alice'); const target=doc(store,'sessions/post');
  const photoDoc=doc(store,'sessions/post/photos/photo_0');
  await assertFails(updateDoc(target,{gps:{latitude:37,longitude:127,source:'manual'}}));
  await assertFails(setDoc(photoDoc,{...photo(0),gps:{latitude:37,longitude:127,source:'manual'}}));
  await assertFails(setDoc(photoDoc,photo(0,'bob')));
  await assertFails(setDoc(photoDoc,{...photo(0),urls:{...photo(0).urls,large:'https://evil.example/photo'}}));
  await assertSucceeds(updateDoc(target,{shareLocation:true,location:'공원',gps:{latitude:37,longitude:127,source:'manual'}}));
  await assertSucceeds(setDoc(photoDoc,photo(0)));
  await assertFails(getDoc(doc(db('bob'),'sessions/post/photos/photo_0')));
});
test('private membership cannot be read by another user or gain admin fields',async()=>{
  await assertFails(getDoc(doc(db('bob'),'members/alice')));
  await assertFails(getDoc(doc(db(admin),'members/alice')));
  await assertFails(updateDoc(doc(db('alice'),'members/alice'),{isAdmin:true}));
  await assertFails(updateDoc(doc(db('alice'),'members/alice'),{acceptedAt:'not timestamp'}));
  await assertSucceeds(setDoc(doc(db('newuser'),'members/newuser'),{policyVersion:'2026-10-04',acceptedAt:serverTimestamp(),deleting:false}));
});
test('closed launch gate and pending deletion refuse membership and post writes',async()=>{
  await assertSucceeds(updateDoc(doc(db('alice'),'members/alice'),{deleting:true}));
  await assertFails(updateDoc(doc(db('alice'),'sessions/post'),{title:'blocked'}));
  await assertFails(updateDoc(doc(db('alice'),'members/alice'),{deleting:false}));
  await assertSucceeds(deleteDoc(doc(db('alice'),'sessions/post')));
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'config/community'),{enabled:false}));
  await assertFails(setDoc(doc(db('newuser'),'members/newuser'),{policyVersion:'2026-10-04',acceptedAt:serverTimestamp(),deleting:false}));
  await assertFails(setDoc(doc(db('bob'),'sessions/new'),session('bob','new')));
  await assertFails(setDoc(doc(db('bob'),'config/community'),{enabled:true}));
});
test('reports are private, idempotent and only administrators resolve them',async()=>{
  const report={reporterId:'alice',sessionId:'public',reason:'저작권 침해',status:'open',createdAt:serverTimestamp()};
  const target=doc(db('alice'),'reports/alice_public');
  await assertSucceeds(setDoc(target,report));
  await assertFails(setDoc(target,report));
  await assertFails(getDoc(doc(db('bob'),'reports/alice_public')));
  await assertFails(updateDoc(target,{status:'resolved'}));
  await assertSucceeds(updateDoc(doc(db(admin),'reports/alice_public'),{status:'resolved'}));
  await assertSucceeds(getDocs(query(collection(db('alice'),'reports'),where('reporterId','==','alice'))));
  await assertSucceeds(deleteDoc(target));
});
test('storage enforces ownership, content type, private reads and delete/list scope',async()=>{
  const path='members/alice/sessions/post/photo_0/thumb.webp';
  const mine=ref(user('alice').storage(),path);
  await assertSucceeds(uploadBytes(mine,new Uint8Array([1,2,3]),{contentType:'image/webp'}));
  await assertFails(uploadBytes(ref(user('bob').storage(),path),new Uint8Array([1]),{contentType:'image/webp'}));
  await assertFails(uploadBytes(ref(user('alice').storage(),'members/alice/sessions/post/photo_0/medium.webp'),new Uint8Array([1]),{contentType:'text/html'}));
  await assertFails(getBytes(ref(user('bob').storage(),path)));
  await assertSucceeds(listAll(ref(user('alice').storage(),'members/alice')));
  await assertFails(listAll(ref(user('bob').storage(),'members/alice')));
  await assertFails(deleteObject(ref(user('bob').storage(),path)));
  await assertSucceeds(deleteObject(mine));
});

test('password and anonymous identities cannot register, publish or upload even with a member profile', async()=>{
  for (const provider of ['password', 'anonymous']) {
    const context=env.authenticatedContext('alice',{email_verified:true,firebase:{sign_in_provider:provider}});
    await assertFails(setDoc(doc(context.firestore(),'sessions/new'),session('alice','new')));
    await assertFails(uploadBytes(ref(context.storage(),'members/alice/sessions/post/photo_0/large.webp'),new Uint8Array([1]),{contentType:'image/webp'}));
    const newcomer=env.authenticatedContext('fresh',{email_verified:true,firebase:{sign_in_provider:provider}});
    await assertFails(setDoc(doc(newcomer.firestore(),'members/fresh'),{policyVersion:'2026-10-04',acceptedAt:serverTimestamp(),deleting:false}));
  }
});
test('clients cannot inspect voter identifiers or forge aggregate like counts', async()=>{
  for(const store of [db('alice'),db(admin),env.unauthenticatedContext().firestore()]) {
    for(const path of ['likeStats/public','likeVotes/public/voters/hash']) {
      await assertFails(setDoc(doc(store,path),{count:999,liked:true}));
      await assertFails(getDoc(doc(store,path)));
    }
  }
});
