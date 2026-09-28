const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const { once } = require("node:events");

const SECRET = "whsec_regression_test_only";
const SIGNATURE = "test-signature-accepted-only-by-mock";
const INTENT_ID = "pi_regression_test";
const event = {
  id: "evt_regression_test",
  type: "payment_intent.succeeded",
  data: { object: { id: INTENT_ID, latest_charge: "ch_regression_test" } },
};
// Whitespace makes accidental JSON parsing/reserialization detectable.
const rawBody = JSON.stringify(event, null, 2) + "\n";

async function setup(t, secret = SECRET) {
  const env = {
    STRIPE_SECRET_KEY: "sk_test_regression_dummy",
    STRIPE_WEBHOOK_SECRET: secret,
    NOTIFICATION_SERVICE_URL: "http://notification.invalid",
    SERVICE_SECRET: "test-only",
  };
  const previousEnv = new Map(Object.keys(env).map((key) => [key, process.env[key]]));
  const localModules = ["../src/app", "../src/routes/paymentRoutes", "../src/controllers/paymentController"];
  const previousModules = new Map(localModules.map((name) => {
    const id = require.resolve(name);
    return [id, require.cache[id]];
  }));
  // Registered before setup so failures also restore globals and cached lazy Stripe state.
  t.after(() => {
    t.mock.restoreAll();
    for (const [key, value] of previousEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    for (const [id, cached] of previousModules) {
      if (cached === undefined) delete require.cache[id];
      else require.cache[id] = cached;
    }
  });
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  for (const id of previousModules.keys()) delete require.cache[id];

  const calls = { verification: [], lookup: [], updates: [], saves: [], notifications: [], charges: [] };
  const payment = {
    stripePaymentIntentId: INTENT_ID,
    status: "pending",
    receiptUrl: "",
    appointmentId: "appointment-test",
    amount: 1500,
    patientSnapshot: { email: "patient@example.invalid" },
    async save() { calls.saves.push(this.status); },
  };
  const paymentMock = {
    async findOne(query) {
      calls.lookup.push(query);
      return query.stripePaymentIntentId === INTENT_ID ? payment : null;
    },
    async findOneAndUpdate(...args) {
      calls.updates.push(args);
      return null;
    },
  };
  const stripeMock = {
    webhooks: {
      constructEvent(body, signature, webhookSecret) {
        calls.verification.push({ body, signature, webhookSecret });
        if (!Buffer.isBuffer(body) || !body.equals(Buffer.from(rawBody)) ||
            signature !== SIGNATURE || webhookSecret !== SECRET) {
          throw new Error("Mock signature verification failed");
        }
        return structuredClone(event);
      },
    },
    charges: {
      async retrieve(id) {
        calls.charges.push(id);
        return { receipt_url: "https://receipt.example.invalid/test" };
      },
    },
  };
  const axiosMock = {
    async post(...args) { calls.notifications.push(args); return { data: {} }; },
    async get() { throw new Error("Unexpected external GET request"); },
  };
  const controllerId = require.resolve("../src/controllers/paymentController");
  const originalLoad = Module._load;
  // Scope interception to the controller; never import the real model or Stripe SDK.
  t.mock.method(Module, "_load", function (request, parent, isMain) {
    if (parent?.filename === controllerId) {
      if (request === "../models/Payment") return paymentMock;
      if (request === "mongoose") return {};
      if (request === "axios") return axiosMock;
      if (request === "stripe") return () => stripeMock;
    }
    return originalLoad.call(this, request, parent, isMain);
  });

  // Use the production Express app and raw-body middleware, but never server.js/DB startup.
  const app = require("../src/app");
  const server = app.listen(0, "127.0.0.1");
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
  });
  await once(server, "listening");
  async function send(signature) {
    const headers = { "content-type": "application/json" };
    if (signature !== undefined) headers["stripe-signature"] = signature;
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/payments/webhook`, {
      method: "POST", headers, body: rawBody, signal: AbortSignal.timeout(5000),
    });
    return { status: response.status, body: await response.json() };
  }
  return { calls, payment, send };
}

function assertUnchanged({ calls, payment }) {
  assert.equal(payment.status, "pending");
  assert.equal(payment.receiptUrl, "");
  for (const name of ["lookup", "updates", "saves", "notifications", "charges"]) {
    assert.deepEqual(calls[name], [], `Rejected webhook must not cause ${name}`);
  }
}

// These tests mutate process.env and the CommonJS loader, so keep them sequential.
test("missing signature rejects the webhook without side effects", { concurrency: false }, async (t) => {
  const fixture = await setup(t);
  assert.deepEqual(await fixture.send(), { status: 400, body: { message: "Invalid webhook signature" } });
  assert.equal(fixture.calls.verification.length, 0);
  assertUnchanged(fixture);
});

test("invalid signature invokes verification and rejects the webhook", { concurrency: false }, async (t) => {
  const fixture = await setup(t);
  assert.deepEqual(await fixture.send("invalid-signature"), { status: 400, body: { message: "Invalid webhook signature" } });
  assert.equal(fixture.calls.verification.length, 1);
  assert.deepEqual(fixture.calls.verification[0], { body: Buffer.from(rawBody), signature: "invalid-signature", webhookSecret: SECRET });
  assertUnchanged(fixture);
});

test("missing webhook secret rejects unsigned JSON without a fallback", { concurrency: false }, async (t) => {
  const fixture = await setup(t);
  delete process.env.STRIPE_WEBHOOK_SECRET;
  assert.deepEqual(await fixture.send(), { status: 500, body: { message: "Webhook unavailable" } });
  assert.equal(fixture.calls.verification.length, 0);
  assertUnchanged(fixture);
});

test("placeholder webhook secret rejects the request", { concurrency: false }, async (t) => {
  const fixture = await setup(t, "whsec_placeholder_replace_with_real_secret");
  assert.deepEqual(await fixture.send(SIGNATURE), { status: 500, body: { message: "Webhook unavailable" } });
  assert.equal(fixture.calls.verification.length, 0);
  assertUnchanged(fixture);
});

test("valid verified success event marks the matching payment paid", { concurrency: false }, async (t) => {
  const fixture = await setup(t);
  assert.deepEqual(await fixture.send(SIGNATURE), { status: 200, body: { received: true } });
  assert.deepEqual(fixture.calls.verification, [{ body: Buffer.from(rawBody), signature: SIGNATURE, webhookSecret: SECRET }]);
  assert.deepEqual(fixture.calls.lookup, [{ stripePaymentIntentId: INTENT_ID }]);
  assert.equal(fixture.payment.status, "paid");
  assert.deepEqual(fixture.calls.saves, ["paid"]);
  assert.deepEqual(fixture.calls.charges, ["ch_regression_test"]);
  assert.equal(fixture.payment.receiptUrl, "https://receipt.example.invalid/test");
  assert.equal(fixture.calls.notifications.length, 1);
  assert.equal(fixture.calls.notifications[0][0], "http://notification.invalid/api/notifications/payment");
  assert.equal(fixture.calls.notifications[0][1].status, "paid");
  assert.deepEqual(fixture.calls.updates, []);
});

test("forged success events cannot modify a matching pending payment", { concurrency: false }, async (t) => {
  const fixture = await setup(t);
  for (const signature of [undefined, "forged-signature"]) {
    assert.deepEqual(await fixture.send(signature), { status: 400, body: { message: "Invalid webhook signature" } });
    assertUnchanged(fixture);
  }
  assert.equal(fixture.calls.verification.length, 1);
});
