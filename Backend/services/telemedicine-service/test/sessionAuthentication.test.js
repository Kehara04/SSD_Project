const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");

// Isolate authentication from database writes and notification side effects.
const controllerPath = require.resolve("../src/controllers/sessionController");
let controllerCalls = 0;
const handler = (req, res) => {
  controllerCalls++;
  res.json({ userId: req.user.id });
};
require.cache[controllerPath] = {
  id: controllerPath,
  filename: controllerPath,
  loaded: true,
  exports: Object.fromEntries(
    ["createSession", "getSessionByAppointment", "joinSession", "endSession"]
      .map((name) => [name, handler])
  ),
};

test("all session routes require a valid JWT before calling controllers", async (t) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "authentication-test-secret";
  const app = express();
  app.use("/api/sessions", require("../src/routes/sessionRoutes"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => {
    server.close();
    server.closeAllConnections();
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });
  const base = `http://127.0.0.1:${server.address().port}/api/sessions`;
  const valid = jwt.sign({ id: "test-patient", role: "patient" }, process.env.JWT_SECRET, { expiresIn: "5m" });
  const expired = jwt.sign({ id: "test-patient" }, process.env.JWT_SECRET, { expiresIn: -1 });
  const wrongSignature = jwt.sign({ id: "test-patient" }, "wrong-secret");
  for (const [method, path] of [["POST", ""], ["GET", "/appointment/test"], ["PUT", "/test/join"], ["PUT", "/test/end"]]) {
    for (const token of [null, "invalid-token", expired, wrongSignature, valid]) {
      await t.test(`${method} ${path || "/"}: ${token === valid ? "valid" : token === null ? "missing" : token === expired ? "expired" : token === wrongSignature ? "wrong signature" : "malformed"} token`, async () => {
        const before = controllerCalls;
        const response = await fetch(base + path, {
          method,
          headers: token === null ? {} : { Authorization: `Bearer ${token}` },
        });
        assert.equal(response.status, token === valid ? 200 : 401);
        assert.equal(controllerCalls, before + (token === valid ? 1 : 0));
        if (token === valid) assert.equal((await response.json()).userId, "test-patient");
        else await response.json();
      });
    }
  }
});
