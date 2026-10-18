// Run: node --test tests/video-access.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('app/api/video/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
function setup({ auth = true, rpcError = null, finished = false, expired = false, configured = true, cleanupFails = false } = {}) {
  const calls = [], grants = [];
  const room = { server_time: new Date().toISOString(), ends_at: new Date(Date.now() + (expired ? -60000 : 60000)).toISOString(), finished_at: finished ? new Date().toISOString() : null };
  const db = { auth: { getUser: async () => ({ data: { user: auth ? { id: 'verified-user' } : null } }) }, rpc: async name => { calls.push(name); return { data: room, error: rpcError ? { message: rpcError } : null }; }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { capacity: 5 } }) }) }) }) };
  class Service { async createRoom(options) { calls.push(['create', options]); } async removeParticipant(...args) { calls.push(['remove', ...args]); if (cleanupFails) throw Error(); } }
  class Token { constructor(key, secret, options) { calls.push(['token', options]); } addGrant(grant) { grants.push(grant); } async toJwt() { return 'test-token'; } }
  const exports = {};
  vm.runInNewContext(code, { exports, process: { env: configured ? { LIVEKIT_URL: 'wss://example.test', LIVEKIT_API_KEY: 'key', LIVEKIT_API_SECRET: 'secret' } : {} }, require: name => ({ 'next/server': { NextResponse: { json: (body, options) => ({ body, ...options }) } }, '@supabase/supabase-js': { createClient: () => db }, 'livekit-server-sdk': { AccessToken: Token, RoomServiceClient: Service, TrackSource: { CAMERA: 1, MICROPHONE: 2 } } })[name] });
  const run = (action = 'join', authorization = 'Bearer test') => exports.POST({ headers: { get: () => authorization }, json: async () => ({ sessionId: '00000000-0000-0000-0000-000000000001', action }) });
  return { run, calls, grants };
}
test('requires verified login and refuses missing authorization', async () => {
  assert.equal((await setup().run('join', null)).status, 401);
  assert.equal((await setup({ auth: false }).run()).status, 401);
});
test('booking/time gate failures never issue tokens', async () => {
  for (const rpcError of ['BOOKING_REQUIRED', 'SESSION_NOT_STARTED', 'SESSION_CLOSED']) {
    const fixture = setup({ rpcError }); assert.equal((await fixture.run()).status, 403); assert.equal(fixture.grants.length, 0);
  }
});
test('finished/expired participant gets removed, cannot rejoin', async () => {
  for (const options of [{ finished: true }, { expired: true }]) {
    const f = setup(options); assert.equal((await f.run()).status, 403); assert.equal(f.grants.length, 0); assert.ok(f.calls.some(c => c[0] === 'remove'));
  }
});
test('join grants only verified identity, requested session, camera/mic, bounded capacity', async () => {
  const f = setup(); const response = await f.run(); assert.equal(response.status, 200);
  assert.equal(f.grants[0].room, 'session-00000000-0000-0000-0000-000000000001');
  assert.equal(f.grants[0].canPublishData, false);
  assert.equal(f.calls.find(c => c[0] === 'token')[1].identity, 'verified-user');
  assert.equal(f.calls.find(c => c[0] === 'create')[1].maxParticipants, 5);
  assert.equal(response.headers['Cache-Control'], 'private, no-store');
});
test('missing config fails closed, check does not issue tokens', async () => {
  assert.equal((await setup({ configured: false }).run()).status, 503);
  const f = setup(); assert.equal((await f.run('check')).status, 200); assert.equal(f.grants.length, 0);
});
test('finish commits result and removes only current user; cleanup failure preserves success', async () => {
  const f = setup(); assert.equal((await f.run('finish')).body.finished, true);
  assert.equal(f.calls[0], 'finish_my_session'); assert.equal(f.calls[1][2], 'verified-user');
  const failed = await setup({ cleanupFails: true }).run('finish'); assert.equal(failed.body.finished, true); assert.equal(failed.body.mediaCleanupPending, true);
});
