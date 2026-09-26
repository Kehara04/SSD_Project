const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const controllerPath = path.join(__dirname, "../src/controllers/paymentController.js");
const controllerSource = readFileSync(controllerPath, "utf8");

// Evaluate the actual CommonJS controller in a fresh context per case. Only
// dependency doubles are available: no real MongoDB, Stripe, or HTTP clients.
// Neither process.env nor Node's shared module cache is modified.
function fixture(t, {
  id = "pi_failopen_demo_001",
  missing = false,
  intent,
} = {}) {
  const mutations = [];
  const savedStatuses = [];
  const record = {
    stripePaymentIntentId: id,
    status: "pending",
    receiptUrl: "",
    amount: 2500,
    currency: "lkr",
    appointmentDate: "2026-09-23",
    appointmentTime: "10:00",
    patientSnapshot: { email: "patient@example.invalid", phone: "0000000000" },
  };
  const save = t.mock.fn(async () => { savedStatuses.push(record.status); });
  record.save = save;
  const payment = new Proxy(record, {
    set(target, key, value) {
      mutations.push({ key, value });
      target[key] = value;
      return true;
    },
  });
  const findOne = t.mock.fn(async () => missing ? null : payment);
  const retrieve = t.mock.fn(async () => {
    if (!intent) throw new Error("Simulated Stripe verification outage");
    return intent;
  });
  const retrieveCharge = t.mock.fn(async () => ({
    receipt_url: "https://receipts.example.invalid/verified-charge",
  }));
  const post = t.mock.fn(async () => ({ data: {} }));
  const get = t.mock.fn(async () => ({ data: {} }));
  const dependencies = {
    "../models/Payment": { findOne },
    mongoose: {},
    axios: { post, get },
    stripe: () => ({
      paymentIntents: { retrieve },
      charges: { retrieve: retrieveCharge },
    }),
  };
  const sandbox = {
    module: { exports: {} },
    process: { env: {
      STRIPE_SECRET_KEY: "sk_test_isolated_dummy",
      NOTIFICATION_SERVICE_URL: "http://notifications.example.invalid",
    } },
    console: { error() {}, warn() {}, log() {} },
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  };
  vm.runInNewContext(controllerSource, sandbox, { filename: controllerPath });

  async function confirm() {
    const response = {
      statusCode: 200,
      body: undefined,
      status(code) { this.statusCode = code; return this; },
      json(body) {
        // Match Express JSON serialization, including cross-context objects.
        this.body = JSON.parse(JSON.stringify(body));
        return this;
      },
    };
    await sandbox.module.exports.confirmPaymentByIntentId(
      { params: { paymentIntentId: id } },
      response,
      (error) => { throw error; },
    );
    assert.equal(findOne.mock.callCount(), 1);
    assert.equal(findOne.mock.calls[0].arguments[0].stripePaymentIntentId, id);
    return response;
  }
  return { payment, mutations, savedStatuses, save, retrieve, retrieveCharge, post, get, confirm };
}

function assertUntouched(f) {
  assert.equal(f.payment.status, "pending");
  assert.equal(f.payment.receiptUrl, "");
  assert.deepEqual(f.mutations, []);
  assert.equal(f.save.mock.callCount(), 0);
  assert.equal(f.retrieveCharge.mock.callCount(), 0);
  assert.equal(f.post.mock.callCount(), 0);
  assert.equal(f.get.mock.callCount(), 0);
}

async function failedVerification(t, options) {
  const f = fixture(t, options);
  const response = await f.confirm();
  assert.equal(response.statusCode, 502);
  assert.deepEqual(response.body, { message: "Payment verification failed" });
  assert.equal(f.retrieve.mock.callCount(), 1);
  assert.deepEqual(Array.from(f.retrieve.mock.calls[0].arguments), [f.payment.stripePaymentIntentId]);
  return f;
}

function assertNotification(f, status) {
  assert.equal(f.post.mock.callCount(), 1);
  const [url, payload] = f.post.mock.calls[0].arguments;
  assert.equal(url, "http://notifications.example.invalid/api/notifications/payment");
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    email: f.payment.patientSnapshot.email,
    phone: f.payment.patientSnapshot.phone,
    amount: f.payment.amount,
    date: f.payment.appointmentDate,
    time: f.payment.appointmentTime,
    status,
  });
  assert.equal(f.get.mock.callCount(), 0);
}

test("VULN-06: Stripe verification failure returns HTTP 502", async (t) => {
  await failedVerification(t);
});

test("VULN-06: verification failure leaves payment pending without a mock receipt", async (t) => {
  const f = await failedVerification(t);
  assert.equal(f.payment.status, "pending");
  assert.notEqual(f.payment.status, "paid");
  assert.equal(f.payment.receiptUrl, "");
});

test("VULN-06: verification failure prevents database writes and all field mutations", async (t) => {
  const f = await failedVerification(t);
  assert.equal(f.save.mock.callCount(), 0);
  assert.deepEqual(f.mutations, []);
});

test("VULN-06: verification failure sends no notification or downstream request", async (t) => {
  const f = await failedVerification(t);
  assert.equal(f.post.mock.callCount(), 0);
  assert.equal(f.get.mock.callCount(), 0);
  assert.equal(f.retrieveCharge.mock.callCount(), 0);
});

test("VULN-06: missing payment returns HTTP 404 without consulting Stripe", async (t) => {
  const f = fixture(t, { missing: true });
  const response = await f.confirm();
  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, { message: "Payment record not found" });
  assert.equal(f.retrieve.mock.callCount(), 0);
  assertUntouched(f);
});

test("VULN-06: genuine Stripe success saves paid status and preserves notification", async (t) => {
  const f = fixture(t, {
    id: "pi_valid_test_001",
    intent: { id: "pi_valid_test_001", status: "succeeded" },
  });
  const response = await f.confirm();
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "paid");
  assert.equal(f.payment.status, "paid");
  assert.equal(f.retrieve.mock.callCount(), 1);
  assert.deepEqual(Array.from(f.retrieve.mock.calls[0].arguments), ["pi_valid_test_001"]);
  assert.equal(f.save.mock.callCount(), 1);
  assert.deepEqual(f.savedStatuses, ["paid"]);
  assert.equal(f.payment.receiptUrl, "");
  assert.equal(f.retrieveCharge.mock.callCount(), 0);
  assertNotification(f, "paid");
});

test("VULN-06: successful payment uses the verified Stripe charge receipt", async (t) => {
  const f = fixture(t, {
    intent: { status: "succeeded", latest_charge: "ch_verified_001" },
  });
  const response = await f.confirm();
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, "paid");
  assert.equal(f.retrieveCharge.mock.callCount(), 1);
  assert.deepEqual(Array.from(f.retrieveCharge.mock.calls[0].arguments), ["ch_verified_001"]);
  assert.equal(response.body.receiptUrl, "https://receipts.example.invalid/verified-charge");
  assert.equal(f.payment.receiptUrl, response.body.receiptUrl);
  assert.equal(f.save.mock.callCount(), 1);
  assert.deepEqual(f.savedStatuses, ["paid"]);
  assertNotification(f, "paid");
});

for (const status of ["requires_payment_method", "canceled"]) {
  test(`VULN-06: Stripe ${status} preserves failed-payment behavior`, async (t) => {
    const f = fixture(t, { intent: { status } });
    const response = await f.confirm();
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, "failed");
    assert.equal(f.payment.status, "failed");
    assert.equal(f.retrieve.mock.callCount(), 1);
    assert.equal(f.save.mock.callCount(), 1);
    assert.deepEqual(f.savedStatuses, ["failed"]);
    assert.equal(f.payment.receiptUrl, "");
    assert.equal(f.retrieveCharge.mock.callCount(), 0);
    assertNotification(f, "failed");
  });
}

test("VULN-06: mock-prefixed intent cannot bypass Stripe verification", async (t) => {
  const f = await failedVerification(t, { id: "pi_test_mock_failopen_001" });
  assertUntouched(f);
});
