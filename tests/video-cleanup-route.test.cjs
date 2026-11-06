const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm'), fs = require('node:fs'), ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('app/api/video/cleanup/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function setup({ configured = true, failed = 0, throws = false } = {}) {
  const exports = {}, calls = [];
  vm.runInNewContext(code, { exports, Buffer, Date, process: { env: configured ? { VIDEO_CLEANUP_SECRET: 'test-secret', LIVEKIT_URL: 'wss://example.test', LIVEKIT_API_KEY: 'key', LIVEKIT_API_SECRET: 'secret' } : {} }, require: name => ({
    'node:crypto': require('node:crypto'),
    'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } },
    'livekit-server-sdk': { RoomServiceClient: class {} },
    '@/lib/videoCleanup': { cleanupVideoRooms: async (...args) => { calls.push(args); if (throws) throw Error('private credentials'); return { inspected: 2, eligible: 1, deleted: args[2] ? 0 : 1, failed, dryRun: args[2] }; } }
  })[name] });
  return { calls, run: (header = 'Bearer test-secret', query = '') => exports.POST({ headers: { get: () => header }, nextUrl: new URL('https://example.test/api/video/cleanup' + query) }) };
}
test('missing config and incorrect credentials never run cleanup', async () => {
  assert.equal((await setup({ configured: false }).run()).status, 503);
  for (const header of [null, 'Bearer wrong', 'Bearer test-secrex']) {
    const f = setup(); assert.equal((await f.run(header)).status, 401); assert.equal(f.calls.length, 0);
  }
});
test('authenticated dry-run and scheduled POST select correct behavior', async () => {
  const f = setup();
  assert.equal((await f.run(undefined, '?dryRun=true')).body.dryRun, true);
  const result = await f.run(); assert.equal(result.body.dryRun, false);
  assert.equal(result.status, 200); assert.equal(result.headers['Cache-Control'], 'no-store');
});
test('service and partial failures return retryable status without secrets', async () => {
  assert.equal((await setup({ failed: 1 }).run()).status, 503);
  const result = await setup({ throws: true }).run();
  assert.equal(result.status, 503); assert.equal(result.body.error, 'CLEANUP_FAILED');
  assert.ok(!JSON.stringify(result).includes('private credentials'));
});
