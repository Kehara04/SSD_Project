Payment verification fail-open fix

Date: 19 September 2026

Original issue

The payment service contained a fail-open condition in the payment confirmation flow. When Stripe payment verification failed, the application did not reject the request or preserve the payment in its current state. Instead, it switched to mock behavior and treated the payment intent as successful.

Affected local endpoint:

GET http://localhost:5005/api/payments/confirm/:paymentIntentId

Affected controller:

Backend/services/payment-service/src/controllers/paymentController.js

Affected function:

confirmPaymentByIntentId

The vulnerable logic attempted to retrieve the payment intent from Stripe. If that request failed, the catch block changed the flow to mock mode:

try {
  intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
} catch (err) {
  console.warn("Stripe fetch failed (using mock data):", err.message);
  isMock = true;
}

The code then converted mock mode into a successful payment result:

if (isMock) {
  intent = { status: "succeeded" };
}

Because the later logic trusted intent.status === "succeeded", the stored payment could be changed from pending to paid even though Stripe verification had failed.

The original flow was therefore:

Stripe verification fails
        ↓
Application switches to mock mode
        ↓
Mock intent is assigned status "succeeded"
        ↓
Payment status becomes "paid"

This is a fail-open security weakness because an external payment verification failure is converted into a successful business outcome instead of being rejected.

Before-fix verification

The user reproduced the issue using a test-only payment record.

A pending payment record was prepared with:

stripePaymentIntentId: "pi_failopen_demo_001"
status: "pending"

The identifier was intentionally chosen so that it would not represent a valid Stripe PaymentIntent.

The same test payment was then queried through:

GET http://localhost:5005/api/payments/confirm/pi_failopen_demo_001

A valid Bearer token was supplied so that the request reached the payment confirmation controller.

Before the fix, Stripe retrieval failed, but the application entered its mock fallback path. The payment was then marked as:

status: "paid"

The generated mock receipt also demonstrated that the vulnerable path had been used:

https://mock-receipt.example.com/pi_failopen_demo_001

This confirmed that Stripe verification failure could incorrectly result in a successful payment state.

Security fix

The payment confirmation logic was changed to fail closed.

All isMock behavior was removed from confirmPaymentByIntentId.

The previous behavior:

catch (err) {
  console.warn("Stripe fetch failed (using mock data):", err.message);
  isMock = true;
}

if (isMock) {
  intent = { status: "succeeded" };
}

was replaced with:

try {
  intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
} catch (err) {
  console.error("Stripe payment verification failed:", err.message);

  return res.status(502).json({
    message: "Payment verification failed",
  });
}

The mock receipt logic was also removed.

The payment is now changed to paid only when Stripe successfully returns a payment intent whose status is:

succeeded

The fixed flow is:

Stripe verification succeeds
        ↓
Stripe returns status "succeeded"
        ↓
Payment may become "paid"

If Stripe verification fails:

Stripe verification fails
        ↓
Application returns HTTP 502
        ↓
No payment status change
        ↓
Payment remains "pending"

This prevents an external verification failure from being converted into a successful payment.

Files changed

Paths are relative to the repository root.

File : Change

Backend/services/payment-service/src/controllers/paymentController.js : Removed mock-success fallback from confirmPaymentByIntentId and changed Stripe verification failure to return HTTP 502

security-evidence/vuln-06-payment-fail-open/before-fix/ : Contains before-fix evidence screenshots

security-evidence/vuln-06-payment-fail-open/after-fix/ : Contains after-fix retest evidence screenshots

security-evidence/vuln-06-payment-fail-open/security-notes.md : Documents the vulnerability, fix, verification, and evidence

No unrelated payment controller functions were intentionally modified as part of this VULN-06 fix.

In particular, the fix scope was limited to:

confirmPaymentByIntentId

The Stripe webhook vulnerability is handled separately under VULN-05.

Validation performed

The same negative test scenario used before the fix was repeated after implementation.

Test PaymentIntent:

pi_failopen_demo_001

Starting database state:

status: "pending"
receiptUrl: ""

Retest request:

GET http://localhost:5005/api/payments/confirm/pi_failopen_demo_001

Authorization:

Bearer token for a valid test user

Expected secure result:

HTTP 502 Bad Gateway

Response:

{
  "message": "Payment verification failed"
}

After the request, the same payment record must remain:

status: "pending"

and must not receive a mock receipt URL.

The fixed implementation therefore verifies that a failed Stripe lookup cannot mutate the payment into a successful state.

Postman verification

Ensure the payment service is running with the fixed source code.

Log in using a valid registered test user and obtain a fresh JWT.

In Postman, select Authorization → Bearer Token and paste the token without manually adding another Bearer prefix.

Confirm that the test payment exists in the payment-service database with:

stripePaymentIntentId: "pi_failopen_demo_001"
status: "pending"

Send:

GET http://localhost:5005/api/payments/confirm/pi_failopen_demo_001

Confirm that the API returns:

502 Bad Gateway

with:

{
  "message": "Payment verification failed"
}

Refresh the same payment record in MongoDB and confirm that it still shows:

status: "pending"

Confirm that no mock receipt URL has been written.

For screenshots, capture the request URL, response status, response body, and the relevant database fields. Redact passwords, usable JWTs, Stripe keys, and any personal information.

Evidence files

The following filenames are used as descriptive evidence labels.

Before the fix

Fail-open vulnerable code

Payment before test — pending

Payment incorrectly marked paid

After the fix

Recommended evidence files:

Fail-closed fixed code

Payment before retest — pending

Stripe verification failure rejected

Payment remains pending after failed verification

Regression expectations

The fix must preserve legitimate payment behavior while removing the unsafe fallback.

The expected behavior after the fix is:

Scenario

Expected result

Payment record does not exist

404 Payment record not found

Stripe retrieval fails

502 Payment verification failed

Stripe returns succeeded

Payment may be marked paid

Stripe returns canceled

Pending payment may be changed to failed

Stripe returns requires_payment_method

Pending payment may be changed to failed

Receipt retrieval fails after a genuine successful payment

Payment confirmation continues without creating a fake receipt

Invalid or missing authentication token

Request is rejected by authentication middleware

The important regression rule is:

Stripe verification failure must never produce payment success.

Commit history

Recommended commit sequence:

docs(security): add before-fix evidence for VULN-06 payment fail-open
fix(payment): fail closed when Stripe payment verification fails
docs(security): add after-fix evidence for VULN-06 payment fail-open

This keeps the vulnerability evidence, security fix, and retest evidence separated in Git history.

Scope and limitations

This fix addresses the fail-open behavior inside confirmPaymentByIntentId.

It ensures that a failed Stripe payment-intent retrieval cannot be converted into a successful payment state.

This change does not by itself redesign all development or testing mock-payment behavior elsewhere in the payment service. Any mock payment functionality outside this confirmation path should remain isolated to explicit development or test configuration and must not be reachable as a fallback in production.

VULN-05, which concerns Stripe webhook signature verification, is a separate issue and should be documented and tested independently.

The MongoDB records and payment identifiers used for this evidence are test-only values. No real payment information, Stripe secrets, passwords, access tokens, or personal data should be included in committed screenshots or documentation.

## Additional security verification using Burp Suite

Burp Suite Community Edition Repeater was used to repeat
the original payment verification attack against the secured
payment service.

The request targeted:

GET /api/payments/confirm/pi_failopen_demo_001

A valid test-user Bearer token was supplied.

The application returned HTTP 502 Bad Gateway with:

{
  "message": "Payment verification failed"
}

The test confirmed that Stripe verification failure was
rejected instead of being converted into mock payment success.

The payment record was subsequently checked in MongoDB
to confirm that its status remained pending.

Evidence:
- after-fix/burp-stripe-verification-rejected.png
- after-fix/burp-payment-remains-pending.png