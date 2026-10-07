const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const exifr = require('exifr');
const source = ts.transpileModule(fs.readFileSync('src/lib/geo.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const api = { exports: {} };
new Function('exports', 'require', source)(api.exports, require);
const { isValidGps, sessionGps } = api.exports;
const demoSource = ts.transpileModule(fs.readFileSync('src/lib/demo-locations.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const demoApi = { exports: {} };
new Function('exports', 'require', demoSource)(demoApi.exports, () => api.exports);
const { withDemoCoordinates } = demoApi.exports;
const gps = (latitude = 37.5, longitude = 127) => ({ latitude, longitude, source: 'manual' });

test('accepts zero and boundary coordinates; rejects missing, nonnumeric and out-of-range coordinates', () => {
  for (const value of [gps(0, 0), gps(-90, -180), gps(90, 180)]) assert.equal(isValidGps(value), true);
  for (const value of [null, undefined, {}, gps(NaN), gps(Infinity), gps(91), gps(0, 181), { latitude: '37', longitude: 127 }]) assert.equal(isValidGps(value), false);
});

test('uses explicit session position, then cover GPS, then first valid photo; supports legacy sessions', () => {
  const first = gps(10, 20), cover = gps(30, 40), explicit = gps(50, 60);
  const session = { gps: explicit, coverImageId: 'cover', photos: [{ id: 'first', gps: first }, { id: 'cover', gps: cover }] };
  assert.equal(sessionGps(session), explicit);
  session.gps = null;
  assert.equal(sessionGps(session), cover);
  session.photos[1].gps = gps(91);
  assert.equal(sessionGps(session), first);
  assert.equal(sessionGps({ photos: [{ id: 'old' }] }), undefined);
});

test('all existing demo posts receive coordinates and existing GPS is preserved', () => {
  const ids = [...fs.readFileSync('src/lib/mock-data.ts', 'utf8').matchAll(/^    id: "([^"]+)"/gm)].map(match => match[1]);
  assert.equal(ids.length, 22);
  for (const id of ids) {
    const session = { id, photos: [] };
    const seeded = withDemoCoordinates(session);
    assert.equal(isValidGps(seeded.gps), true, id);
    assert.equal(seeded.gps.source, 'demo');
    assert.equal(withDemoCoordinates(seeded), seeded);
    const original = { id, photos: [{ gps: gps() }] };
    assert.equal(withDemoCoordinates(original), original);
  }
  const unknown = { id: 'new-real-post', photos: [] };
  assert.equal(withDemoCoordinates(unknown), unknown);
});

function jpegWithGps(latRef, lngRef) {
  // Minimal JPEG APP1/EXIF fixture with a TIFF GPS IFD.
  const tiff = Buffer.alloc(128);
  tiff.write('II'); tiff.writeUInt16LE(42, 2); tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8);
  tiff.writeUInt16LE(0x8825, 10); tiff.writeUInt16LE(4, 12); tiff.writeUInt32LE(1, 14); tiff.writeUInt32LE(26, 18);
  tiff.writeUInt16LE(4, 26);
  function entry(at, tag, type, count, value) {
    tiff.writeUInt16LE(tag, at); tiff.writeUInt16LE(type, at + 2); tiff.writeUInt32LE(count, at + 4);
    if (typeof value === 'string') tiff.write(value, at + 8); else tiff.writeUInt32LE(value, at + 8);
  }
  entry(28, 1, 2, 2, latRef); entry(40, 2, 5, 3, 80);
  entry(52, 3, 2, 2, lngRef); entry(64, 4, 5, 3, 104);
  [37, 30, 0, 127, 15, 0].forEach((value, index) => { tiff.writeUInt32LE(value, 80 + index * 8); tiff.writeUInt32LE(1, 84 + index * 8); });
  const payload = Buffer.concat([Buffer.from('Exif\0\0'), tiff]);
  const header = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0, 0]); header.writeUInt16BE(payload.length + 2, 4);
  return Buffer.concat([header, payload, Buffer.from([0xff, 0xd9])]);
}

test('reads GPS from original JPEG metadata with both hemispheres and tolerates absent EXIF', async () => {
  assert.deepEqual(await exifr.gps(jpegWithGps('N', 'E')), { latitude: 37.5, longitude: 127.25 });
  assert.deepEqual(await exifr.gps(jpegWithGps('S', 'W')), { latitude: -37.5, longitude: -127.25 });
  assert.equal(await exifr.gps(Buffer.from([0xff, 0xd8, 0xff, 0xd9])), undefined);
});

test('viewer uses only active photo GPS then explicit session GPS, never another photo', () => {
  const photo = { gps: gps(0, 0) };
  const session = { gps: gps(50, 60), coverImageId: 'cover', photos: [{ id: 'cover', gps: gps(30, 40) }] };
  assert.equal(api.exports.viewingPhotoGps(photo, session), photo.gps);
  assert.equal(api.exports.viewingPhotoGps({ gps: gps(91) }, session), session.gps);
  assert.equal(api.exports.viewingPhotoGps(undefined, session), session.gps);
  session.gps = null;
  assert.equal(api.exports.viewingPhotoGps({}, session), undefined);
});

test('nearby discovery sorts by distance, respects radius and excludes private or demo locations',()=>{
  const origin=gps(37,127);
  const post=(id, point, extra={})=>({id,isPublished:true,gps:point,photos:[],...extra});
  const sessions=[post('far',gps(38,127)),post('near',gps(37.01,127)),post('here',origin),post('hidden',origin,{shareLocation:false}),post('draft',origin,{isPublished:false}),post('demo',{...origin,source:'demo'}),post('missing',null)];
  const result=api.exports.nearbySessions(sessions,origin,50);
  assert.deepEqual(result.map(item=>item.session.id),['here','near']);
  assert.equal(result[0].distance,0);
  assert.ok(result[1].distance>1 && result[1].distance<1.2);
  assert.equal(api.exports.sessionGps(sessions[3]),undefined);
  assert.ok(api.exports.distanceKm(gps(0,179.9),gps(0,-179.9))<23);
});
