const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function render(status, props = {}) {
 const exports = {};
 const jsx = (type, props) => ({ type, ...props });
 const code = ts.transpileModule(fs.readFileSync('components/SessionBookingStatus.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
 vm.runInNewContext(code, { exports, require: name => name === 'react/jsx-runtime' ? { jsx, jsxs: jsx } : name === 'react' ? { createContext: () => ({}), useContext: () => status } : name === 'next/link' ? { default: 'a' } : {}, encodeURIComponent });
 return exports.SessionBookingAction({ sessionId: 'session', full: false, tasks: '', ...props });
}
test('booked sessions link to the existing booking even when full', () => {
 const r = render({ bookings: { session: 'booking' } }, { full: true });
 assert.equal(r.children[0].children, '已預約');
 assert.equal(r.children[1].href, '/my-sessions#booking');
});
test('loading and failed lookups do not offer a duplicate booking action', () => {
 assert.equal(render({ loading: true }).children, '確認預約中…');
 assert.equal(render({ failed: true }).href, '/my-sessions');
});
test('unbooked sessions preserve task selection and full sessions are disabled', () => {
 assert.equal(render({ bookings: {} }, { tasks: '1,2' }).href, '/sessions/book?session=session&tasks=1%2C2');
 assert.equal(render({ bookings: {} }, { full: true }).disabled, true);
});
