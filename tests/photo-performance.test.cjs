const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const sharp = require('sharp');
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}
const { PhotoCache } = load('lib/photo-cache.ts');
test('cache deduplicates pending loads, retries errors and evicts oldest bytes', async () => {
  const cache = new PhotoCache(2, 60000, value => value.length);
  let calls = 0;
  const loader = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 10)); return 'a'; };
  assert.deepEqual(await Promise.all([cache.get('a', loader), cache.get('a', loader)]), ['a', 'a']);
  assert.equal(calls, 1);
  await assert.rejects(cache.get('bad', async () => { throw Error('offline'); }));
  assert.equal(await cache.get('bad', async () => 'b'), 'b');
  await cache.get('c', async () => 'c');
  await cache.get('a', loader);
  assert.equal(calls, 2);
});
test('photo cache never bypasses RLS; sizes share one download; ETag remains protected', async () => {
  const jpg = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#336633' } }).jpeg().toBuffer();
  let allowed = true, queries = 0, downloads = 0;
  const db = {
    from(table) {
      return { select() { return this; }, eq() { return this; }, async maybeSingle() {
        queries++;
        await new Promise(resolve => setTimeout(resolve, 5));
        return { data: allowed ? (table === 'sighting_photo_sets' ? { paths: ['owner/test.jpg'] } : { photo_url: 'owner/test.jpg' }) : null, error: null };
      } };
    },
    storage: { from() { return { async download() { downloads++; return { data: new Blob([jpg], { type: 'image/jpeg' }), error: null }; } }; } },
  };
  const { GET } = load('app/sightings/[id]/photo/route.ts', {
    '@/lib/supabase/server': { createClient: async () => db },
    '@/lib/sighting-photo': { sightingPhotoPath: value => value },
    '@/lib/photo-cache': { PhotoCache },
  });
  const id = '11111111-1111-4111-8111-111111111111';
  const get = (width, headers = {}, query = '') => GET(new Request(`http://localhost/sightings/${id}/photo?w=${width}${query}`, { headers }), { params: Promise.resolve({ id }) });
  const [small, large] = await Promise.all([get(320), get(1280)]);
  assert.equal(small.status, 200); assert.equal(large.status, 200);
  assert.equal(downloads, 1); assert.equal(queries, 1);
  assert.equal(small.headers.get('content-type'), 'image/webp');
  const etag = large.headers.get('etag');
  assert.equal((await get(1280, { 'if-none-match': etag })).status, 304);
  assert.equal(queries, 2); assert.equal(downloads, 1);
  assert.equal((await get(320, {}, '&photo=foreign.jpg')).status, 404);
  allowed = false;
  assert.equal((await get(1280, { 'if-none-match': etag })).status, 404);
  assert.equal(downloads, 1);
});

