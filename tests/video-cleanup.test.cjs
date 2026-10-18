const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript'), fs = require('node:fs'), vm = require('node:vm');
const exportsForTest = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/videoCleanup.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsForTest });
const { expiredVideoRoom, cleanupVideoRooms } = exportsForTest;
const id='00000000-0000-0000-0000-000000000001';
const room = (endsAt, overrides={}) => ({ name: `session-${id}`, metadata: JSON.stringify({app:'zashipao',version:1,sessionId:id,endsAt,...overrides}) });
test('only deletes matched, marked, expired rooms', () => {
  assert.equal(expiredVideoRoom(room('2026-01-01'),Date.parse('2026-01-02')),true);
  for (const item of [room('2027-01-01'),room('bad'),room('2026-01-01',{app:'other'}),room('2026-01-01',{sessionId:'other'}),{name:'other',metadata:'{}'},{name:`session-${id}`,metadata:''}]) assert.equal(expiredVideoRoom(item,Date.parse('2026-01-02')),false);
});
test('one failed delete does not prevent others, next invocation can retry',async () => {
  const calls=[];
  const service={listRooms:async()=>[room('2026-01-01'),room('2026-01-01'),room('2027-01-01')],deleteRoom:async name=>{calls.push(name);if(calls.length===1)throw Error();}};
  const result=await cleanupVideoRooms(service,Date.parse('2026-01-02'));
  assert.equal(result.deleted,1);assert.equal(result.failed,1);assert.equal(calls.length,2);
});
