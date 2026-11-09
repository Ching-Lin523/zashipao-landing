const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const context = { exports: {}, Intl, Date };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/weeklyTasks.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, context);
const week = context.exports.taipeiWeek;
test('Taiwan Monday boundary is independent of US Sunday', () => {
 assert.equal(week(new Date('2026-11-08T15:59:59Z')), '2026-11-02');
 assert.equal(week(new Date('2026-11-08T16:00:00Z')), '2026-11-09');
});
test('next week and year boundary', () => {
 assert.equal(week(new Date('2026-12-31T12:00:00Z')), '2026-12-28');
 assert.equal(week(new Date('2026-12-31T12:00:00Z'),1), '2027-01-04');
});
