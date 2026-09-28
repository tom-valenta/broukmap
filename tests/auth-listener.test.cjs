const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
test('auth listener returns before profile query and token refresh cannot cancel queued profile', async () => {
  let callback, inCallback = false, queries = 0;
  const effects = [], timers = new Map(); let timerId = 0;
  const react = { createContext: () => ({ Provider: 'provider' }), useState: initial => [initial, () => {}], useRef: current => ({ current }), useMemo: fn => fn(), useCallback: fn => fn, useEffect: fn => effects.push(fn) };
  const db = { auth: { onAuthStateChange(fn) { callback = fn; return { data: { listener: null, subscription: { unsubscribe() {} } } }; } }, from() {
    assert.equal(inCallback, false, 'database query must happen outside auth callback'); queries++;
    return { select() { return this; }, eq() { return this; }, async single() { return { data: { id: 'user' } }; } };
  } };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('app/contexts/AuthProvider.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require','exports','setTimeout','clearTimeout',code)(name => name === 'react' ? react : name === '@/lib/supabase/client' ? { createClient: () => db } : require(name), exports, fn => { timers.set(++timerId, fn); return timerId; }, id => timers.delete(id));
  exports.AuthProvider({ children: null, initialUser: null, initialProfile: null });
  const cleanup = effects[0]();
  inCallback = true;
  assert.equal(callback('SIGNED_IN', { user: { id: 'user' } }), undefined);
  callback('TOKEN_REFRESHED', { user: { id: 'user' } });
  inCallback = false;
  assert.equal(queries, 0); assert.equal(timers.size, 1);
  for (const fn of timers.values()) fn();
  await Promise.resolve();
  assert.equal(queries, 1);
  cleanup();
});
