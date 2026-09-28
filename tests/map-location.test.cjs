const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function locationModule() {
  let success, failure, options, calls = 0, now = 100000;
  const navigator = { geolocation: { getCurrentPosition(ok, fail, opts) { calls++; success = ok; failure = fail; options = opts; } } };
  const code = ts.transpileModule(fs.readFileSync('lib/map-location.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('exports', 'navigator', 'Date', code)(exports, navigator, { now: () => now });
  return { ...exports, success: () => success({ coords: { latitude: 50, longitude: 14, accuracy: 80 }, timestamp: now }), fail: code => failure({ code }), calls: () => calls, options: () => options, advance: ms => { now += ms; } };
}
test('Strict Mode mounts share a single quick location request and reuse a fresh fix', async () => {
  const geo = locationModule();
  const first = geo.locateMap(); const second = geo.locateMap();
  assert.equal(geo.calls(), 1); assert.equal(geo.options().enableHighAccuracy, false);
  geo.success();
  assert.deepEqual(await first, await second);
  await geo.locateMap(); assert.equal(geo.calls(), 1);
  const explicit = geo.locateMap(true); assert.equal(geo.calls(), 2); assert.equal(geo.options().maximumAge, 0);
  geo.success(); await explicit;
  geo.advance(60001); assert.equal(geo.recentMapLocation(), null);
});
test('permission rejection clears location and a retry can succeed', async () => {
  const geo = locationModule();
  const first = geo.locateMap(); geo.success(); await first;
  const rejected = geo.locateMap(true); geo.fail(1);
  await assert.rejects(rejected, /Povol přístup/);
  assert.equal(geo.recentMapLocation(), null);
  const retry = geo.locateMap(true); geo.success(); await retry;
  assert.equal(geo.calls(), 3);
});
