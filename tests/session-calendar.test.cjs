const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/sessionCalendar.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports: exportsObject, URL, URLSearchParams, TextEncoder, Date });
const { calendarOrigin, googleCalendarUrl, sessionIcs } = exportsObject;
const session = { id: 'test-session', title: '整理,資料;一起\\開始\n下一行' + '中文'.repeat(60), starts_at: '2026-12-02T21:00:00+08:00', ends_at: '2026-12-02T21:50:00+08:00' };
test('exports absolute instants consistently for Google and ICS', () => {
 const google = new URL(googleCalendarUrl(session, 'https://example.com'));
 assert.equal(google.searchParams.get('dates'), '20261202T130000Z/20261202T135000Z');
 assert.equal(google.searchParams.get('ctz'), 'Asia/Taipei');
 assert.equal(google.searchParams.get('text'), `雜事房｜${session.title}`);
 const ics = sessionIcs(session, 'https://example.com').replace(/\r\n /g, '');
 assert.ok(ics.includes('DTSTART:20261202T130000Z\r\nDTEND:20261202T135000Z'));
 assert.ok(ics.includes('https://example.com/sessions/waiting/test-session'));
});
test('escapes text and folds UTF-8 at 75 bytes without corrupting Chinese', () => {
 const ics = sessionIcs(session, null);
 for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
 const unfolded = ics.replace(/\r\n /g, '');
 assert.ok(unfolded.includes('整理\\,資料\\;一起\\\\開始\\n下一行'));
 assert.ok(unfolded.includes('中文'.repeat(60)));
 assert.ok(!ics.includes('127.0.0.1'));
 assert.throws(() => sessionIcs({ ...session, ends_at: session.starts_at }, null));
});
test('only uses public HTTPS origins and excludes credentials and paths', () => {
 assert.equal(calendarOrigin('http://127.0.0.1:3002'), null);
 assert.equal(calendarOrigin('https://localhost'), null);
 assert.equal(calendarOrigin('https://user:secret@example.com'), null);
 assert.equal(calendarOrigin('https://example.com/path?secret=x'), 'https://example.com');
 assert.equal(calendarOrigin('not a url'), null);
});
