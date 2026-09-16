# TELEMEDICINE SERVICE – `README.md`

```md
# Telemedicine Service

Handles video consultation sessions.

---

## Responsibilities

- Generate meeting links
- Manage session data

---

## Features

- Video meeting creation
- Linked to appointment lifecycle

---

## Flow

- Triggered after appointment approval
- Generates meeting URL
- Sent via Notification Service

---

## Environment Variables

```env
PORT=5004
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
SERVICE_SECRET=internal_secret

NOTIFICATION_SERVICE_URL=http://localhost:5007
APPOINTMENT_SERVICE_URL=http://localhost:5003
```

## Run Service

```bash
npm install
npm start