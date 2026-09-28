# PAYMENT SERVICE – `README.md`

```md
# Payment Service

Handles payment processing using Stripe.

---

## Responsibilities

- Process payments
- Handle Stripe webhooks
- Update payment status

---

## Features

- Stripe integration
- Secure payments
- Webhook handling

---

## API Endpoints

| Method | Endpoint |
|--------|--------|
| POST | /api/payments/create |
| POST | /api/payments/webhook |

---

## Environment Variables

```env
PORT=5005
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
SERVICE_SECRET=internal_secret

STRIPE_SECRET_KEY=your_stripe_api_key
STRIPE_WEBHOOK_SECRET=whsec_placeholder_replace_with_real_secret

CLIENT_URL=http://localhost:5173
NODE_ENV=development
NOTIFICATION_SERVICE_URL=http://localhost:5007
APPOINTMENT_SERVICE_URL=http://localhost:5003
```

## Run Service

```bash
npm install
npm start