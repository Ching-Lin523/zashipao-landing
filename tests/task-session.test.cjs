const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function setup() {
  let authChange, validation = async () => ({ data: { user: { id: 'A' } }, error: null });
  const timers = [], writes = [], reads = [], exports = {};
  const client = {
    auth: { onAuthStateChange: callback => { authChange = callback; }, getUser: () => validation() },
    from: () => ({
      select: () => ({ eq: (_, owner) => ({ order: async () => { reads.push(owner); return { data: [{ id: 1, title: owner + ' task', first_noticed: '2026-11-05' }], error: null }; } }) }),
      upsert: rows => { writes.push(rows); return { select: async () => ({ data: rows.map(({ id }) => ({ id })), error: null }) }; },
      delete: () => { writes.push('delete'); return { eq: () => ({ in: (_, ids) => ({ select: async () => ({ data: ids.map(id => ({ id })), error: null }) }) }) }; }
    })
  };
  const code = ts.transpileModule(fs.readFileSync('components/useSharedTasks.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports, setTimeout: fn => timers.push(fn), window: { addEventListener() {} }, require: name => name === 'react' ? { useEffect: fn => fn(), useSyncExternalStore: (_, snapshot) => snapshot() } : { browserAuth: () => client } });
  const snapshot = () => exports.useSharedTasks(); snapshot();
  return { snapshot, writes, reads, validate: fn => { validation = fn; }, change: id => authChange('SIGNED_IN', { user: { id } }), async ready() { this.change('A'); timers.length = 0; await snapshot()[2].reload(); } };
}
test('deleted account clears cached tasks and blocks writes', async () => {
  for (const status of [401, 403]) {
    const f = setup(); await f.ready();
    f.validate(async () => ({ data: { user: null }, error: { status } }));
    assert.equal(await f.snapshot()[1](tasks => [...tasks, { id: 2, title: 'new', firstNoticed: '2026-11-05' }]), false);
    assert.equal(f.writes.length, 0); assert.equal(f.snapshot()[0].length, 0);
    assert.equal(f.snapshot()[2].userId, null); assert.equal(f.snapshot()[2].saving, false);
    assert.match(f.snapshot()[2].error, /重新登入/);
  }
});
test('network failure preserves identity and cached data for retry', async () => {
  const f = setup(); await f.ready();
  f.validate(async () => { throw Error('offline'); });
  await f.snapshot()[1]([]);
  assert.equal(f.writes.length, 0); assert.equal(f.snapshot()[2].userId, 'A');
  assert.equal(f.snapshot()[0].length, 1); assert.equal(f.snapshot()[2].saving, false);
  assert.doesNotMatch(f.snapshot()[2].error, /登入已失效/);
});
test('refresh clears deleted identity before requesting private data', async () => {
  const f = setup(); await f.ready(); const count = f.reads.length;
  f.validate(async () => ({ data: { user: null }, error: null }));
  await f.snapshot()[2].reload();
  assert.equal(f.reads.length, count); assert.equal(f.snapshot()[0].length, 0);
  assert.equal(f.snapshot()[2].loading, false);
});
test('account switch during verification cannot write or clear new account state', async () => {
  const f = setup(); await f.ready(); let resolve;
  f.validate(() => new Promise(r => { resolve = r; }));
  const pending = f.snapshot()[1]([]);
  f.change('B'); resolve({ data: { user: null }, error: { status: 403 } });
  assert.equal(await pending, false); assert.equal(f.writes.length, 0);
  assert.equal(f.snapshot()[2].userId, 'B'); assert.equal(f.snapshot()[2].error, '');
});
test('valid account can save and remove tasks', async () => {
  const f = setup(); await f.ready();
  assert.equal(await f.snapshot()[1](tasks => tasks.map(t => ({ ...t, title: 'edited' }))), true);
  assert.equal(f.snapshot()[0][0].title, 'edited');
  assert.equal(await f.snapshot()[1]([]), true); assert.equal(f.snapshot()[0].length, 0);
  assert.equal(f.writes.length, 2);
});
