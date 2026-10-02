const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const api = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/weather.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(api);
test('labels daily mean temperatures without inventing missing weather', () => {
 assert.equal(api.dailyWeatherSummary(3, 18.4), '흐림 · 일평균 18°C');
 assert.equal(api.dailyWeatherSummary(71, -3.2), '눈 · 일평균 -3°C');
 assert.equal(api.dailyWeatherSummary(0, 0), '맑음 · 일평균 0°C');
 assert.equal(api.dailyWeatherSummary(3, null), null);
 assert.equal(api.dailyWeatherSummary(null, 18), null);
 assert.equal(api.dailyWeatherSummary(999, 18), null);
});
