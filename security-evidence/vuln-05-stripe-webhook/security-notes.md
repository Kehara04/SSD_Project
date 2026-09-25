# Stripe webhook signature verification fix

Date: 18 September 2026

## Original issue

The payment service could accept webhook events without verifying that they were signed using the configured Stripe webhook secret.

Local endpoint: `POST http://localhost:5005/api/payments/webhook`.

In the original `stripeWebhook` controller, signature verification ran only when `STRIPE_WEBHOOK_SECRET` was present and was not `whsec_placeholder_replace_with_real_secret`. Otherwise, the controller used:

```js
event = JSON.parse(req.body.toString());
```

This fallback trusted caller-supplied JSON. When the secret was missing or set to the placeholder, both unsigned requests and requests with an invalid `stripe-signature` header could reach payment-event processing. A properly configured secret already enabled verification in the original implementation; the vulnerability was the bypass under missing or placeholder configuration.

The webhook route does not require a user Bearer token. Its trust boundary is webhook signature verification.

## Security impact

An attacker who knew a stored payment's Stripe PaymentIntent ID could submit a forged `payment_intent.succeeded` event. The controller looks up that ID, sets the matching payment to `paid`, saves it, and attempts a payment notification. Under the vulnerable configuration, this could record payment success without a genuine successful Stripe payment.

A forged `payment_intent.payment_failed` event could also change a matching pending payment to `failed` and attempt a failure notification.

The pre-fix screenshots demonstrate acceptance of unverified events. A `200 OK` response alone does not prove a payment changed: the handler also acknowledges success events when no matching payment exists.

## Signature verification changes

The controller now rejects requests before event processing unless configuration and signature verification succeed:

1. A missing, empty, or exact placeholder `STRIPE_WEBHOOK_SECRET` returns **500 Internal Server Error**:

   ```json
   { "message": "Webhook unavailable" }
   ```

2. With a configured non-placeholder secret, a missing `stripe-signature` header returns **400 Bad Request**:

   ```json
   { "message": "Invalid webhook signature" }
   ```

3. Requests with a signature must pass the existing Stripe SDK verification call:

   ```js
   event = getStripe().webhooks.constructEvent(
     req.body,
     signature,
     webhookSecret
   );
   ```

4. Errors from this verification block return the same generic **400** response. The controller logs only `Webhook signature verification failed`, rather than returning or logging the underlying exception message.

The direct JSON-parsing fallback was removed. These rejection paths return before payment lookups, payment status changes, receipt retrieval, or notification calls in the event-processing block.

The configuration check runs first, so a missing secret returns **500** even when the request also has a missing or invalid signature.

## Existing request handling retained

The existing `src/app.js` middleware preserves the raw request body for this endpoint before the general JSON parser:

```js
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
```

The route remains `router.post("/webhook", stripeWebhook)`. No JWT middleware was added to the webhook.

Verified events continue through the existing success and failure handlers. Successfully handled events, unhandled event types, and success events with no matching payment are acknowledged with:

```json
{ "received": true }
```

## Files changed or reviewed

Paths are relative to the repository root.

| File | Change or role |
| --- | --- |
| `Backend/services/payment-service/src/controllers/paymentController.js` | Existing fix removes the verification bypass, rejects missing configuration/signatures, and makes verification errors generic |
| `Backend/services/payment-service/src/app.js` | Reviewed existing raw-body middleware ordering; no change required by this fix |
| `Backend/services/payment-service/src/routes/paymentRoutes.js` | Reviewed existing webhook route; no change required by this fix |
| `security-evidence/vuln-05-stripe-webhook/security-notes.md` | Documents the fix and all supplied evidence |

The reviewed working-tree source diff is limited to the webhook verification block in `paymentController.js`.

## Validation and observed results

All four before-fix screenshots and all five after-fix screenshots were reviewed alongside the current controller and its Git diff.

| Evidence case | Observed result |
| --- | --- |
| Before fix: request labelled as unsigned | Postman shows **200 OK** and `{ "received": true }` for a supplied success-event payload |
| Before fix: invalid signature | Postman shows `stripe-signature: invalid-signature` with **200 OK** and `{ "received": true }` |
| After fix: no signature | Postman shows **400 Bad Request** and `Invalid webhook signature` |
| After fix: invalid signature | Postman shows `stripe-signature: invalid-signature` with **400 Bad Request** and `Invalid webhook signature` |
| After fix: missing-secret case | Postman shows **500 Internal Server Error** and `Webhook unavailable`; the controller confirms missing and placeholder secrets share this response |
| After fix: valid signed event | Stripe CLI shows a forwarded `payment_intent.succeeded` event receiving **200** from the local webhook endpoint |

The before-fix file named `payment-marked-paid.png` visibly shows an authenticated appointment-list request returning **200 OK**. The captured portion does not show a payment status field, so it does not independently establish that a payment was marked paid.

The signed-event screenshot demonstrates successful webhook delivery and acknowledgement. It does not show a matching local payment record being updated.

No automated test suite or new live requests were run while preparing this document. The payment service's `npm test` script is currently the default "no test specified" placeholder. Review-time `git diff --check` passed; this is a whitespace check, not a runtime security test.

## Manual verification procedure

Use the local test environment and disposable payment records when checking state changes.

1. With a configured webhook signing secret, send a Postman `POST` request to `http://localhost:5005/api/payments/webhook`. Select raw JSON and `Content-Type: application/json`. Use this representative payload:

   ```json
   {
     "id": "evt_test_unverified_001",
     "object": "event",
     "type": "payment_intent.succeeded",
     "data": {
       "object": {
         "id": "pi_test_unverified_001",
         "status": "succeeded"
       }
     }
   }
   ```

2. Send without a `stripe-signature` header. Expect **400** and `Invalid webhook signature`.
3. Repeat with `stripe-signature: invalid-signature`. Expect the same **400** response.
4. In a disposable local configuration, unset the webhook secret or use the exact placeholder, then reload the service configuration. Repeat the request and expect **500** and `Webhook unavailable`. Restore the correct configuration afterward.
5. For the positive case, use Stripe CLI forwarding for `payment_intent.succeeded` to the same local endpoint and configure the service with that listener's signing secret. The supplied screenshot records this workflow returning **200**.
6. To verify payment-state effects separately, use a genuine test event whose PaymentIntent ID matches a disposable local payment, then inspect that payment. For rejected requests, compare the record before and after to confirm its status remains unchanged.

These steps describe repeatable checks; they are not additional claimed test results.

## Evidence files

### Before the fix

- [Original conditional verification and JSON fallback](before-fix/vulnerable-webhook-bypass-code.png)
- [Unsigned webhook accepted](before-fix/no-signature-webhook-accepted.png)
- [Invalid signature accepted](before-fix/invalid-signature-webhook-accepted.png)
- [Appointment response captured as payment-marked-paid evidence](before-fix/payment-marked-paid.png)

### After the fix

- [Mandatory verification and rejection code](after-fix/fixed-webhook-verification-code.png)
- [Unsigned webhook rejected](after-fix/after-fixno-signature-webhook-rejected.png)
- [Invalid signature rejected](after-fix/invalid-signature-webhook-rejected.png)
- [Missing-secret case rejected](after-fix/missing-webhook-secret-rejected.png)
- [Stripe CLI signed webhook acknowledged](after-fix/security-evidencevuln-05-stripe-webhookafter-fixvalid-signed-webhook-accepted.png)

Links preserve the existing screenshot filenames.

## Scope and limitations

This fix closes the missing/placeholder-secret signature bypass in the webhook controller. It does not add event-ID deduplication, new payment-state transition restrictions, or additional amount/currency validation. Repeated verified success events can still reach the existing save and notification logic.

The separate payment initiation and confirmation mock fallbacks are outside this change. This document therefore does not claim that all payment-processing security issues have been resolved.

The signed-event screenshot visibly includes environment secrets, and the appointment screenshot contains personal details. Secret values and personal details are not reproduced here. Redact those screenshots before sharing; any exposed usable credentials should be rotated separately.