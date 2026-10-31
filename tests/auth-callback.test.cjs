const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function compile(path) { return ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText; }
const helpers = {};
vm.runInNewContext(compile('lib/authRedirect.ts'), { exports: helpers });
function setup(mode = 'ok') {
  const exports = {}, calls = [];
  const redirect = url => ({ url: String(url), headers: new Map(), cookies: { values: [], set(...args) { this.values.push(args.length === 1 ? args[0] : { name: args[0], value: args[1] }); }, getAll() { return this.values; } } });
  vm.runInNewContext(compile('app/auth/callback/route.ts'), { exports, URL, process: { env: { NEXT_PUBLIC_SITE_URL: 'https://preview.example.com' } }, require: name => ({
    '@/lib/authRedirect': helpers,
    'next/server': { NextResponse: { redirect } },
    '@supabase/ssr': { createServerClient: (url, key, { cookies }) => ({ auth: { exchangeCodeForSession: async code => {
      calls.push(code); if (mode === 'throw') throw Error('network');
      cookies.setAll([{ name: 'session', value: mode === 'ok' ? 'session-value' : '', options: {} }]);
      return { error: mode === 'error' ? { message: 'expired' } : null };
    } } }) }
  })[name] });
  return { calls, run: query => exports.GET({ nextUrl: new URL('https://preview.example.com/auth/callback' + query), cookies: { getAll: () => [] } }) };
}
test('recovery exchange preserves session cookies and target', async () => {
 const f = setup(); const r = await f.run('?code=test&next=/reset-password');
 assert.equal(r.url, 'https://preview.example.com/reset-password');
 assert.equal(r.cookies.getAll()[0].value, 'session-value');
 assert.equal(r.headers.get('Cache-Control'), 'private, no-store');
});
test('missing, expired and network-failed codes return to recovery without caching', async () => {
 for (const mode of ['error', 'throw']) {
  const r = await setup(mode).run('?code=test&next=/reset-password');
  assert.equal(r.url, 'https://preview.example.com/forgot-password?error=confirmation');
  assert.equal(r.headers.get('Cache-Control'), 'private, no-store');
 }
 const f = setup(); assert.ok((await f.run('?next=/reset-password')).url.includes('/forgot-password?error=')); assert.equal(f.calls.length, 0);
});
test('provider error bypasses exchange and signup errors return to login', async () => {
 const f = setup(); const r = await f.run('?code=test&error=access_denied');
 assert.equal(f.calls.length, 0); assert.ok(r.url.endsWith('/login?error=confirmation'));
});
test('untrusted next values cannot redirect outside the site', async () => {
 for (const target of ['https://evil.example', '//evil.example', '/\\evil.example', '/tasks\r\nLocation:evil']) {
  const r = await setup().run('?code=test&next=' + encodeURIComponent(target));
  assert.equal(r.url, 'https://preview.example.com/sessions');
 }
 assert.equal(helpers.authRedirect('/sessions/book?session=abc'), '/sessions/book?session=abc');
});
