# APPOINTMENT SERVICE – `README.md`

```md
# Appointment Service

Handles appointment booking, slot generation, and scheduling logic.

---

## Responsibilities

- Generate slots from availability
- Validate booking requests
- Manage appointment lifecycle

---

## Features

- Location-based slot generation
- Conflict detection
- Booking, rescheduling, cancellation

---

## Booking Flow

1. Fetch doctor availability
2. Generate slots
3. Patient selects slot
4. Validate slot
5. Create appointment

---

## API Endpoints

| Method | Endpoint |
|--------|--------|
| GET | /appointments/doctors/search |
| GET | /appointments/doctors/:id/slots |
| POST | /appointments |
| GET | /appointments/patient/my |
| GET | /appointments/doctor/my |

---

## Core Logic

- Time slots generated dynamically
- Conflict prevention via DB check
- Location-based filtering

---

## Environment Variables

```env
PORT=5003
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
SERVICE_SECRET=internal_secret

NOTIFICATION_SERVICE_URL=http://localhost:5007
TELEMEDICINE_SERVICE_URL=http://localhost:5004
AUTH_SERVICE_URL=http://localhost:5001
DOCTOR_SERVICE_URL=http://localhost:5000
```
---

## Run Service

```bash
npm install
npm start