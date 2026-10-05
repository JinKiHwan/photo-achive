const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const api={};
new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/session-privacy.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(api);
test('declining location sharing strips session and all nested photo coordinates without mutating the draft',()=>{
 const original={shareLocation:false,gps:{latitude:37,longitude:127},location:'집',photos:[{id:'a',gps:{latitude:1,longitude:2},location:'집',caption:'풍경',exif:{camera:'Camera'}}]};
 const saved=api.applyLocationPrivacy(original);
 assert.equal(saved.gps,null); assert.equal(saved.location,'위치 비공개');
 assert.equal(saved.photos[0].gps,null); assert.equal(saved.photos[0].location,'');
 assert.equal(saved.photos[0].caption,'풍경'); assert.equal(original.gps.latitude,37);
});
test('explicit sharing and legacy posts retain their existing locations',()=>{
 for(const original of [{shareLocation:true,gps:{latitude:37,longitude:127}},{gps:{latitude:37,longitude:127}}]) assert.equal(api.applyLocationPrivacy(original),original);
});
