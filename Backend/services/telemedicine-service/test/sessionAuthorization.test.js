const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const Session = require("../src/models/Session");
const axios = require("axios");

test("session authorization enforces role and ownership before side effects", async (t) => {
  const oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "authorization-test-secret";
  const originals = { findOne: Session.findOne, findById: Session.findById, create: Session.create, get: axios.get, post: axios.post };
  let record, existing, writes, notifications;
  const appointment = { patientId: "patient-owner", doctorId: "doctor-owner", patientSnapshot: { email: "test@example.invalid" } };
  Session.findOne = async () => existing ? record : null;
  Session.findById = async () => record;
  Session.create = async (data) => { writes++; return data; };
  axios.get = async () => ({ data: appointment });
  axios.post = async () => { notifications++; return { data: {} }; };
  const app = express();
  app.use(express.json());
  app.use("/api/sessions", require("../src/routes/sessionRoutes"));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => {
    server.close(); server.closeAllConnections();
    Object.assign(Session, { findOne: originals.findOne, findById: originals.findById, create: originals.create });
    axios.get = originals.get; axios.post = originals.post;
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });
  const base = `http://127.0.0.1:${server.address().port}/api/sessions`;
  const reset = () => {
    writes = 0; notifications = 0; existing = true;
    record = { ...appointment, _id: "session", appointmentId: "appointment", status: "scheduled", meetingUrl: "https://example.invalid/meeting", save: async () => { writes++; } };
  };
  const request = async (method, path, user, body) => {
    const response = await fetch(base + path, { method, headers: { Authorization: `Bearer ${jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "5m" })}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  const body = { appointmentId: "appointment", patientId: "patient-owner", doctorId: "doctor-owner" };
  for (const user of [
    { id: "patient-owner", role: "patient" },
    { id: "doctor-owner", role: "doctor" },
    { id: "outsider", role: "patient" },
    { id: "outsider", role: "doctor" },
    { id: "patient-owner", role: "doctor" },
    { id: "doctor-owner", role: "patient" },
    { id: "patient-owner", role: "admin" },
    { role: "patient" },
  ]) {
    const allowed = (user.id === "patient-owner" && user.role === "patient") || (user.id === "doctor-owner" && user.role === "doctor");
    for (const [method, path] of [["POST", ""], ["GET", "/appointment/appointment"], ["PUT", "/session/join"], ["PUT", "/session/end"]]) {
      await t.test(`${method} ${path || "/"} for ${user.role} ${user.id}`, async () => {
        reset();
        const result = await request(method, path, user, method === "POST" ? body : undefined);
        assert.equal(result.status, allowed ? 200 : 403);
        if (!allowed) {
          assert.deepEqual(result.body, { message: "Forbidden: Access denied" });
          assert.equal(record.status, "scheduled");
          assert.equal(writes, 0); assert.equal(notifications, 0);
        } else if (method === "PUT") {
          assert.equal(writes, 1);
          assert.equal(record.status, path.endsWith("join") ? "active" : "completed");
        }
      });
    }
  }
  await t.test("spoofed participant IDs cannot authorize session creation", async () => {
    reset(); existing = false;
    const result = await request("POST", "", { id: "outsider", role: "patient" }, { ...body, patientId: "outsider" });
    assert.equal(result.status, 403); assert.equal(writes, 0);
  });
  for (const role of ["patient", "doctor"]) {
    await t.test(`assigned ${role} can create a session`, async () => {
      reset(); existing = false;
      const result = await request("POST", "", { id: `${role}-owner`, role }, body);
      assert.equal(result.status, 201); assert.equal(writes, 1);
      assert.equal(result.body.patientId, appointment.patientId);
      assert.equal(result.body.doctorId, appointment.doctorId);
    });
  }
  await t.test("existing session ownership is checked before returning it from POST", async () => {
    reset(); record.patientId = "other-patient";
    const result = await request("POST", "", { id: "patient-owner", role: "patient" }, body);
    assert.equal(result.status, 403); assert.equal(writes, 0);
  });
});



