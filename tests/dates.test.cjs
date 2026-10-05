const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const api = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/dates.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(api);

test('shooting dates preserve the local calendar day at midnight and on leap day', () => {
  assert.equal(api.localDateValue(new Date(2026, 9, 2, 0, 5)), '2026-10-02');
  assert.equal(api.localDateValue(new Date(2024, 1, 29, 23, 55)), '2024-02-29');
});

test('upload dates consistently use Korea time across UTC day and year boundaries', () => {
  assert.equal(api.formatUploadDate('2026-10-01T15:01:00Z'), '2026-10-02');
  assert.equal(api.formatUploadDate('2026-12-31T15:01:00Z'), '2027-01-01');
  assert.equal(api.formatUploadDate('2026-10-01T14:59:00Z'), '2026-10-01');
  assert.equal(api.formatUploadDate(undefined), '기록 없음');
  assert.equal(api.formatUploadDate('invalid'), '기록 없음');
});
