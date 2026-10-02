const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, deps = {}) {
  const result = {};
  const compiled = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('exports', 'require', compiled)(result, name => deps[name] ?? require(name));
  return result;
}
const search = load('src/lib/location-search.ts');
const geo = load('src/lib/geo.ts');
const { GET } = load('src/app/api/locations/search/route.ts', { '@/lib/location-search': search, '@/lib/geo': geo });
test('normalizes road-name spacing without removing city or house number', () => {
  assert.equal(search.normalizeLocationQuery('  구성로 64번길 5 '), '구성로64번길 5');
  assert.equal(search.normalizeLocationQuery('용인시 기흥구 구성로 64번길 5'), '용인시 기흥구 구성로64번길 5');
  assert.equal(search.normalizeLocationQuery('서울 종로구 사직로 9길 5'), '서울 종로구 사직로9길 5');
  assert.equal(search.normalizeLocationQuery('Tokyo Station'), 'Tokyo Station');
});
test('rejects invalid queries and reports missing key', async () => {
  const old = process.env.KAKAO_REST_API_KEY;
  delete process.env.KAKAO_REST_API_KEY;
  try {
    assert.equal((await GET(new Request('http://localhost/api/locations/search?q=a'))).status, 400);
    const response = await GET(new Request('http://localhost/api/locations/search?q=Seoul'));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'NOT_CONFIGURED');
  } finally { if (old !== undefined) process.env.KAKAO_REST_API_KEY = old; }
});
test('uses server key, falls back to keyword lookup, and preserves longitude/latitude order', async () => {
  const oldKey = process.env.KAKAO_REST_API_KEY, oldFetch = global.fetch;
  process.env.KAKAO_REST_API_KEY = 'test-only-key';
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push(url.pathname);
    assert.equal(options.headers.Authorization, 'KakaoAK test-only-key');
    return Response.json({ documents: calls.length === 1 ? [] : [{ place_name: '촬영 장소', address_name: '주소', x: '127.1', y: '37.2' }] });
  };
  try {
    const response = await GET(new Request('http://localhost/api/locations/search?q=Seoul'));
    const result = await response.json();
    assert.deepEqual(calls, ['/v2/local/search/address.json', '/v2/local/search/keyword.json']);
    assert.equal(result.places[0].lat, '37.2');
    assert.equal(result.places[0].lon, '127.1');
    assert.equal(JSON.stringify(result).includes('test-only-key'), false);
  } finally { global.fetch = oldFetch; if (oldKey === undefined) delete process.env.KAKAO_REST_API_KEY; else process.env.KAKAO_REST_API_KEY = oldKey; }
});
