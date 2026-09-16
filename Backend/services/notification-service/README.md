# NOTIFICATION SERVICE – `README.md`

```md
# Notification Service

Handles system-wide notifications.

---

## Responsibilities

- Send notifications on events
- Integrate with telemedicine service

---

## Features

- Booking notifications
- Approval notifications
- Multi-channel ready (email/SMS)

---

## Flow

- Receives event
- Sends notification
- Fetches video link if needed

---

## Environment Variables

```env
PORT=5000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
SERVICE_SECRET=internal_secret
AUTH_SERVICE_URL=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
EMAIL_FROM_NAME=MediChannel

TELEMEDICINE_SERVICE_URL=http://localhost:5004
APPOINTMENT_SERVICE_URL=http://localhost:5003

TEXTLK_API_URL=your_textlk_api_url
TEXTLK_API_TOKEN=your_textlk_api_token
TEXTLK_SENDER_ID=your_textlk_sender_id
```
---

## Run Service

```bash
npm install
npm start