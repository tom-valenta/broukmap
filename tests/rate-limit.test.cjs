const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const code = ts.transpileModule(fs.readFileSync("lib/rate-limit.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loadedModule = { exports: {} };
new Function("require", "module", "exports", code)(name => name === "server-only" ? {} : require(name), loadedModule, loadedModule.exports);
const { takeRateLimit } = loadedModule.exports;

test("rate limiter blocks requests after the quota and resets its window", () => {
  const key = `test:${Date.now()}`;
  assert.equal(takeRateLimit(key, { limit: 2, windowMs: 1_000 }, 10).allowed, true);
  assert.equal(takeRateLimit(key, { limit: 2, windowMs: 1_000 }, 11).allowed, true);
  const blocked = takeRateLimit(key, { limit: 2, windowMs: 1_000 }, 12);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 1);
  assert.equal(takeRateLimit(key, { limit: 2, windowMs: 1_000 }, 1_010).allowed, true);
});
