const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('src/lib/server/like-identity.ts','utf8'), { compilerOptions:{module:ts.ModuleKind.CommonJS} }).outputText;
const api={exports:{}}; new Function('exports','require',source)(api.exports,require);
const {normalizeIp,voterKey,requestIp}=api.exports;
test('IP normalization collapses IPv6 aliases and IPv4 mapped addresses; rejects chains and invalid input',()=>{
  assert.equal(normalizeIp('2001:0db8:0:0:0:0:0:1'),normalizeIp('2001:db8::1'));
  assert.equal(normalizeIp('::ffff:192.0.2.1'),'192.0.2.1');
  for(const value of ['unknown','1.2.3.4, 5.6.7.8','192.0.2.1:1234','']) assert.equal(normalizeIp(value),null);
});
test('vote identifiers are deterministic, secret-dependent and separated for each post',()=>{
  const secret='a'.repeat(32), ip='192.0.2.1';
  assert.equal(voterKey(ip,'post',secret),voterKey(ip,'post',secret));
  assert.notEqual(voterKey(ip,'post',secret),voterKey(ip,'other',secret));
  assert.notEqual(voterKey(ip,'post',secret),voterKey(ip,'post','b'.repeat(32)));
  assert.match(voterKey(ip,'post',secret),/^[a-f0-9]{64}$/);
  assert.throws(()=>voterKey(ip,'post','short'));
});
test('production trusts only explicitly configured proxy header, never a browser forwarded chain',()=>{
  const previous=process.env.NODE_ENV, header=process.env.LIKES_TRUSTED_IP_HEADER;
  try {
    process.env.NODE_ENV='production'; delete process.env.LIKES_TRUSTED_IP_HEADER;
    const request=new Request('https://photo.example/api/likes',{headers:{'x-forwarded-for':'192.0.2.1','x-proxy-ip':'192.0.2.2'}});
    assert.equal(requestIp(request),null);
    process.env.LIKES_TRUSTED_IP_HEADER='x-proxy-ip';
    assert.equal(requestIp(request),'192.0.2.2');
  } finally {
    if(previous===undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV=previous;
    if(header===undefined) delete process.env.LIKES_TRUSTED_IP_HEADER; else process.env.LIKES_TRUSTED_IP_HEADER=header;
  }
});

const routeSource=ts.transpileModule(fs.readFileSync('src/app/api/likes/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const route={exports:{}};
let writes=0;
class LikeError extends Error { constructor(status,message) {super(message);this.status=status;} }
new Function('exports','require',routeSource)(route.exports,name=>{
  if(name.endsWith('/firebase-admin')) return {likesDatabase:()=>({})};
  if(name.endsWith('/like-identity')) return {requestIp:()=> '192.0.2.1'};
  if(name.endsWith('/likes')) return {LikeError,validSessionId:id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(id),readLikes:async()=>({post:{liked:false,count:2}}),setLike:async(db,id,ip,secret,liked)=>{writes++;return{count:liked?3:2,liked};}};
  throw new Error(name);
});
test('like HTTP boundary rejects foreign origins, oversized bodies, malformed IDs and invalid state',async()=>{
  const request=(body,origin='https://photos.example')=>new Request('https://photos.example/api/likes',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
  const before=writes;
  for(const [body,origin,status] of [
    [{sessionId:'post',liked:true},'https://other.example',403],
    [{sessionId:'../post',liked:true},undefined,400],
    [{sessionId:'post',liked:'true'},undefined,400],
    [{sessionId:'post',liked:true,extra:'x'.repeat(2000)},undefined,413],
  ]) assert.equal((await route.exports.POST(request(body,origin))).status,status);
  assert.equal(writes,before);
  const success=await route.exports.POST(request({sessionId:'post',liked:true}));
  assert.equal(success.status,200);assert.deepEqual(await success.json(),{count:3,liked:true});
  assert.match(success.headers.get('cache-control'),/no-store/);
  assert.equal((await route.exports.GET(new Request('https://photos.example/api/likes?ids=../bad'))).status,400);
});
