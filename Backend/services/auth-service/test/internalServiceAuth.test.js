const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

let calls = 0;
const controllerPath = require.resolve("../src/controllers/internalController");
require.cache[controllerPath] = {
  id: controllerPath, filename: controllerPath, loaded: true,
  exports: Object.fromEntries([
    "getUserByIdInternal", "updateUserBasicInternal", "checkNicAvailabilityInternal",
    "getUserByNicInternal", "getApprovedDoctorsInternal",
  ].map(name => [name, (req, res) => { calls++; res.json({ ok: true }); }])),
};

test("internal routes require service credentials and are absent from the public API", async (t) => {
  const previous = { secret: process.env.AUTH_INTERNAL_SECRET, file: process.env.AUTH_INTERNAL_SECRET_FILE };
  delete process.env.AUTH_INTERNAL_SECRET_FILE;
  const secret = "a-test-only-secret-with-at-least-32-characters";
  process.env.AUTH_INTERNAL_SECRET = secret;
  const privateServer = require("../src/internalApp").listen(0, "127.0.0.1");
  const publicServer = require("../src/app").listen(0, "127.0.0.1");
  await Promise.all([privateServer, publicServer].map(server => new Promise(resolve => server.once("listening", resolve))));
  t.after(() => {
    for (const server of [privateServer, publicServer]) { server.close(); server.closeAllConnections(); }
    for (const [key, value] of [["AUTH_INTERNAL_SECRET", previous.secret], ["AUTH_INTERNAL_SECRET_FILE", previous.file]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  const routes = [["GET", "/users/test"], ["PATCH", "/users/test/basic"], ["GET", "/users/by-nic/test"], ["GET", "/users/check-nic/test"], ["GET", "/doctors/approved"]];
  const userToken = jwt.sign({ id: "user", role: "admin" }, "test-user-jwt-secret");
  for (const [method, path] of routes) {
    for (const [label, headers, expected] of [
      ["missing", {}, 401],
      ["wrong", { "x-service-secret": "wrong" }, 401],
      ["user JWT only", { Authorization: `Bearer ${userToken}` }, 401],
      ["valid service", { "x-service-secret": secret }, 200],
    ]) {
      await t.test(`${method} ${path}: ${label}`, async () => {
        const before = calls;
        const response = await fetch(`http://127.0.0.1:${privateServer.address().port}/api/internal${path}`, { method, headers });
        assert.equal(response.status, expected);
        assert.equal(calls, before + (expected === 200 ? 1 : 0));
        const body = await response.text();
        assert.equal(body.includes(secret), false);
      });
    }
    await t.test(`${method} ${path}: inaccessible through public listener even with credential`, async () => {
      const before = calls;
      const response = await fetch(`http://127.0.0.1:${publicServer.address().port}/api/internal${path}`, { method, headers: { "x-service-secret": secret } });
      assert.equal(response.status, 404);
      assert.equal(calls, before);
      await response.text();
    });
  }
  for (const value of [undefined, "", "short", "REPLACE_ME".repeat(5)]) {
    await t.test(`fail closed for unconfigured or weak credential: ${String(value)}`, async () => {
      if (value === undefined) delete process.env.AUTH_INTERNAL_SECRET;
      else process.env.AUTH_INTERNAL_SECRET = value;
      const before = calls;
      const response = await fetch(`http://127.0.0.1:${privateServer.address().port}/api/internal/users/test`, { headers: { "x-service-secret": secret } });
      assert.equal(response.status, 503);
      assert.equal(calls, before);
      await response.text();
    });
  }
});
