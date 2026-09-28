const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
process.env.TZ = 'Europe/Prague';
const exportsObject = {};
new Function('exports', ts.transpileModule(fs.readFileSync('lib/map-filters.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(exportsObject);
const { mapDateRange } = exportsObject;
const filters = { period:'today', day:'2026-09-27', year:'2026', dateField:'created_at', status:'all', species:[] };
test('today follows local midnight while a selected date stays fixed', () => {
  assert.deepEqual(mapDateRange(filters,'2026-09-28'), { from:'2026-09-27T22:00:00.000Z', until:'2026-09-28T22:00:00.000Z' });
  assert.deepEqual(mapDateRange({...filters,period:'day',dateField:'found_date'},'2026-09-28'), {from:'2026-09-27',until:'2026-09-28'});
});
test('DST days, leap years and the year boundary have exclusive correct endings', () => {
  for (const [day,hours] of [['2026-03-29',23],['2026-10-25',25]]) {
    const range=mapDateRange({...filters,period:'day',day},day);
    assert.equal((Date.parse(range.until)-Date.parse(range.from))/3600000,hours);
  }
  assert.deepEqual(mapDateRange({...filters,period:'day',day:'2024-02-29',dateField:'found_date'},'2026-09-28'),{from:'2024-02-29',until:'2024-03-01'});
  assert.deepEqual(mapDateRange({...filters,period:'year',dateField:'found_date'},'2026-09-28'),{from:'2026-01-01',until:'2027-01-01'});
});
test('empty or invalid dates do not silently widen the query', () => {
  assert.throws(()=>mapDateRange({...filters,period:'day',day:''},'2026-09-28'));
  assert.throws(()=>mapDateRange({...filters,period:'day',day:'2026-02-30'},'2026-09-28'));
  assert.throws(()=>mapDateRange({...filters,period:'year',year:''},'2026-09-28'));
  assert.equal(mapDateRange({...filters,period:'all'},'2026-09-28'),null);
});
test('multiple species compose one OR and text cannot inject PostgREST operators', () => {
  const {mapSpeciesExpression}=exportsObject;
  const id='11111111-1111-4111-8111-111111111111';
  assert.equal(mapSpeciesExpression([{id,label:'species'},{id:'text:roháč',label:'roháč'}]),`species_id.in.(${id}),species_name_text.ilike.*roháč*`);
  assert.equal(mapSpeciesExpression([{id:'text:),status.eq.hidden,*',label:'x'}]),'species_name_text.ilike.*status eq hidden*');
  assert.equal(mapSpeciesExpression([]),null);
});
